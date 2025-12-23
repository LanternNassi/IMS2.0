"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect, ReactNode } from "react";
import { useFixedAssetStore, FixedAsset, FixedAssetDto } from "@/store/useFixedAssetStore";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingButton from "@mui/lab/LoadingButton";
import SaveIcon from "@mui/icons-material/Save";
import { TextField, MenuItem } from "@mui/material";
import Edit from "@/components/Edit";
import CircularProgress from "@mui/material/CircularProgress";
import { useToast } from "@/hooks/use-toast";
import Dialog from "@/components/Dialog";
import api from "@/Utils/Request";

const page = () => {
  const [editRow, setEditRow] = useState<FixedAsset | null>(null);
  const [edit, setedit] = React.useState<boolean>(false);
  const { toast } = useToast();
  const {
    isLoading,
    createFixedAsset,
    fetchFixedAssets,
    getFixedAssetById,
    deleteFixedAsset,
    updateFixedAsset,
    fixedAssets,
  } = useFixedAssetStore((state) => state);
  const [submitting, setsubmitting] = useState<boolean>(false);
  const [financialAccounts, setFinancialAccounts] = useState<Array<{
    id: string;
    accountName: string;
    bankName: string;
    type: string;
  }>>([]);
  const [selectedFinancialAccountId, setSelectedFinancialAccountId] = useState<string>("");

  useEffect(() => {
    fetchFixedAssets(null);
  }, [fetchFixedAssets]);

  // Fetch financial accounts on component mount
  useEffect(() => {
    const fetchFinancialAccounts = async () => {
      try {
        const response = await api.get('/FinancialAccounts?includeMetadata=false&page=1&pageSize=100');
        setFinancialAccounts(response.data.financialAccounts || []);
      } catch (error) {
        console.error('Error fetching financial accounts:', error);
      }
    };
    fetchFinancialAccounts();
  }, []);

  const CheckIfBusinessDayisOpen = async (): Promise<boolean> => {
    const response = await api.get('/CashReconciliations/is-today-open')
    return response.data.isOpen as boolean
  }

  const toggleEditDrawer = (newOpen: boolean) => {
    setedit(newOpen);
    if (newOpen && editRow) {
      setSelectedFinancialAccountId(editRow.linkedFinancialAccountId || "");
    } else if (!newOpen) {
      setSelectedFinancialAccountId("");
    }
  };

  const formatCurrency = (amount: number) => {
    return `Shs ${amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const Fields = (): ReactNode => {
    return (
      <>
        <TextField
          variant="outlined"
          id="outlined-basic"
          name="name"
          label="Asset Name"
          defaultValue={editRow ? editRow.name : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          required
        />

        <TextField
          id="outlined-select-type"
          select
          name="type"
          label="Asset Type"
          defaultValue={editRow ? editRow.type : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          required
        >
          <MenuItem value="EQUIPMENT">Equipment</MenuItem>
          <MenuItem value="VEHICLE">Vehicle</MenuItem>
          <MenuItem value="BUILDING">Building</MenuItem>
          <MenuItem value="FURNITURE">Furniture</MenuItem>
          <MenuItem value="COMPUTER">Computer</MenuItem>
          <MenuItem value="OTHER">Other</MenuItem>
        </TextField>

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="purchasePrice"
          label="Purchase Price (Shs)"
          type="number"
          defaultValue={editRow ? editRow.purchasePrice : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          required
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="purchaseDate"
          label="Purchase Date"
          type="date"
          defaultValue={
            editRow && editRow.purchaseDate ? editRow.purchaseDate.split("T")[0] : ""
          }
          sx={{ width: "25vw" }}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
          required
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="depreciationRate"
          label="Annual Depreciation Rate (%)"
          type="number"
          defaultValue={editRow ? editRow.depreciationRate : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          inputProps={{ step: "0.01", min: "0", max: "100" }}
          required
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="usefulLifeYears"
          label="Useful Life (Years)"
          type="number"
          defaultValue={editRow ? editRow.usefulLifeYears : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          required
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="serialNumber"
          label="Serial Number"
          defaultValue={editRow ? editRow.serialNumber : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          required
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="manufacturer"
          label="Manufacturer"
          defaultValue={editRow ? editRow.manufacturer : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          required
        />

        <TextField
          id="financial-account-select"
          select
          name="linkedFinancialAccountId"
          label="Financial Account (Optional)"
          value={selectedFinancialAccountId}
          onChange={(e) => setSelectedFinancialAccountId(e.target.value)}
          sx={{ width: "25vw" }}
          margin="normal"
        >
          <MenuItem value="">None</MenuItem>
          {financialAccounts
            .filter(account => account.type !== 'CREDIT')
            .map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.accountName} - {account.bankName} ({account.type})
              </MenuItem>
            ))}
        </TextField>

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="description"
          label="Description"
          defaultValue={editRow ? editRow.description : ""}
          sx={{ width: "25vw" }}
          margin="normal"
          multiline
          rows={3}
          required
        />

        <LoadingButton
          type="submit"
          sx={{ width: "25vw", height: "8vh" }}
          variant="contained"
          tabIndex={-1}
          loading={submitting}
          loadingPosition="start"
          startIcon={<SaveIcon fontSize="large" />}
        >
          <span>Submit</span>
        </LoadingButton>
      </>
    );
  };

  const handleEdit = async (id: string) => {
    const asset = await getFixedAssetById(id);
    if (asset) {
      setEditRow(asset);
      setSelectedFinancialAccountId(asset.linkedFinancialAccountId || "");
    }
    setedit(true);
  };

  const editAsset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editRow) {
      const formData = new FormData(event.target as HTMLFormElement);

      const updatedAsset: FixedAssetDto = {
        name: formData.get("name") as string,
        type: formData.get("type") as FixedAsset["type"],
        purchasePrice: parseFloat(formData.get("purchasePrice") as string),
        purchaseDate: formData.get("purchaseDate") as string,
        depreciationRate: parseFloat(formData.get("depreciationRate") as string),
        usefulLifeYears: parseInt(formData.get("usefulLifeYears") as string),
        serialNumber: formData.get("serialNumber") as string,
        manufacturer: formData.get("manufacturer") as string,
        description: formData.get("description") as string,
        linkedFinancialAccountId: formData.get("linkedFinancialAccountId") as string || undefined,
      };

      await updateFixedAsset(
        { ...editRow, ...updatedAsset },
        () => {
          toast({
            title: "Fixed Asset Management",
            description: "Asset successfully updated.",
            className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
          });
          fetchFixedAssets(null);
          setedit(false);
        },
        () => {
          toast({
            title: "Fixed Asset Management",
            variant: "destructive",
            description: "An error occurred. Asset couldn't be updated.",
          });
        }
      );
    }
  };

  const handleDelete = async (id: string) => {
    await deleteFixedAsset(
      id,
      () => {
        toast({
          title: "Fixed Asset Management",
          description: "Asset successfully deleted.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchFixedAssets(null);
      },
      () => {
        toast({
          title: "Fixed Asset Management",
          variant: "destructive",
          description: "An error occurred. Asset couldn't be deleted.",
        });
        fetchFixedAssets(null);
      }
    );
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isOpen = await CheckIfBusinessDayisOpen()
    if (!isOpen) {
      toast({
        title: "Fixed Asset Management",
        variant: "destructive",
        description: "Cannot add asset. Business day is not open.",
      });
      return
    }

    setsubmitting(true);
    const formData = new FormData(event.target as HTMLFormElement);

    const data: FixedAssetDto = {
      name: formData.get("name") as string,
      type: formData.get("type") as FixedAsset["type"],
      purchasePrice: parseFloat(formData.get("purchasePrice") as string),
      purchaseDate: formData.get("purchaseDate") as string,
      depreciationRate: parseFloat(formData.get("depreciationRate") as string),
      usefulLifeYears: parseInt(formData.get("usefulLifeYears") as string),
      serialNumber: formData.get("serialNumber") as string,
      manufacturer: formData.get("manufacturer") as string,
      description: formData.get("description") as string,
      linkedFinancialAccountId: formData.get("linkedFinancialAccountId") as string || undefined,
    };

    createFixedAsset(
      data,
      () => {
        setsubmitting(false);
        toast({
          title: "Fixed Asset Management",
          description: "Asset successfully created.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchFixedAssets(null);
        setedit(false);
      },
      () => {
        setsubmitting(false);
        toast({
          title: "Fixed Asset Management",
          variant: "destructive",
          description: "An error occurred. Asset couldn't be added.",
        });
      }
    );
  };

  return (
    <div className="p-6 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold mb-4 dark:text-white text-gray-900">Manage Fixed Assets</h2>

        <div className="space-x-4">
          <Button
            onClick={() => {
              setEditRow(null);
              setSelectedFinancialAccountId("");
              setedit(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <i className="fas fa-plus mr-2"></i>Add
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <i className="fas fa-print mr-2"></i>Print
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <i className="fas fa-file-excel mr-2"></i>Export To Excel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center flex-col h-80 w-full">
          <CircularProgress />
          <h3 className="mt-4 dark:text-gray-300 text-gray-700">Loading Fixed Assets...</h3>
        </div>
      ) : (
        <div className="dark:bg-gray-800 bg-white rounded-lg border dark:border-gray-700 border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="dark:bg-gray-700/50 bg-gray-50">
                <TableHead className="dark:text-gray-300 text-gray-700">Asset Name</TableHead>
                <TableHead className="dark:text-gray-300 text-gray-700">Type</TableHead>
                <TableHead className="dark:text-gray-300 text-gray-700">Purchase Price</TableHead>
                <TableHead className="dark:text-gray-300 text-gray-700">Purchase Date</TableHead>
                <TableHead className="dark:text-gray-300 text-gray-700">Serial Number</TableHead>
                <TableHead className="dark:text-gray-300 text-gray-700">Manufacturer</TableHead>
                <TableHead className="dark:text-gray-300 text-gray-700">Annaul Depreciation Rate</TableHead>
                <TableHead className="dark:text-gray-300 text-gray-700">Useful Life</TableHead>
                <TableHead className="dark:text-gray-300 text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fixedAssets?.map((row) => (
                <TableRow key={row.id} className="dark:hover:bg-gray-700/30 hover:bg-gray-50">
                  <TableCell className="dark:text-gray-200 text-gray-900 font-medium">{row.name}</TableCell>
                  <TableCell className="dark:text-gray-300 text-gray-700">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {row.type}
                    </span>
                  </TableCell>
                  <TableCell className="dark:text-gray-300 text-gray-700">{formatCurrency(row.purchasePrice)}</TableCell>
                  <TableCell className="dark:text-gray-300 text-gray-700">{formatDate(row.purchaseDate)}</TableCell>
                  <TableCell className="dark:text-gray-300 text-gray-700">{row.serialNumber}</TableCell>
                  <TableCell className="dark:text-gray-300 text-gray-700">{row.manufacturer}</TableCell>
                  <TableCell className="dark:text-gray-300 text-gray-700">{row.depreciationRate}%</TableCell>
                  <TableCell className="dark:text-gray-300 text-gray-700">{row.usefulLifeYears} years</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={"secondary"}
                        onClick={() => handleEdit(row.id)}
                      >
                        Edit
                      </Button>
                      <Dialog
                        heading="Delete Fixed Asset"
                        description={`This will delete ${row.name} from the database?`}
                        continueButtonText="Delete"
                        cancelButtonText="Cancel"
                        triggerComponent={
                          <Button size="sm" variant="destructive">
                            Delete
                          </Button>
                        }
                        onContinue={() => handleDelete(row.id)}
                        onCancel={() => { }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Edit
        open={edit}
        Heading={editRow ? "UPDATE FIXED ASSET" : "ADD FIXED ASSET"}
        onSubmit={editRow ? editAsset : handleSave}
        toggleDrawer={toggleEditDrawer}
        Fields={Fields}
      />
    </div>
  );
};

export default page;
