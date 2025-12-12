"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect, ReactNode } from "react";
// import {
//   useCustomerStore,
//   customer,
//   customerDto,
// } from "@/store/useCustomerStore";

import {
  useSupplierStore,
  supplier,
  supplierDto,
} from "@/store/useSupplierStore";
import { toDDMMYYYY } from "@/Utils/ConvertDateTime";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  // TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import LoadingButton from "@mui/lab/LoadingButton";
import SaveIcon from "@mui/icons-material/Save";
import { TextField } from "@mui/material";
import Pagination from "@mui/material/Pagination";
import Edit from "@/components/Edit";
import CircularProgress from "@mui/material/CircularProgress";
import { useToast } from "@/hooks/use-toast";
import Dialog from "@/components/Dialog";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { GetColorFromLetters } from "@/Utils/Usuals";
import ChipInput, { Tag } from "@/components/ChipInput";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import InputAdornment from "@mui/material/InputAdornment";

const page = () => {
  const [editRow, setEditRow] = useState<supplier | null>(null);
  const [edit, setedit] = React.useState<boolean>(false);
  const [AddTags, setAddTags] = React.useState<Tag[]>([]);
  const [page] = React.useState<number>(1);

  const { toast } = useToast();
  const {
    fetchSuppliers,
    getSupplierById,
    deleteSupplier,
    createSupplier,
    searchSupplierTags,
    updateSupplier,
    setSuppliers,
    isLoading,
    suppliers,
    pagination,
  } = useSupplierStore();
  const [submitting, setsubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchSuppliers(null, page).then(response => {
      setSuppliers(response)
    })
  }, [fetchSuppliers, page]);

  const toggleEditDrawer = (newOpen: boolean) => {
    setedit(newOpen);
  };

  const onTagsChange = (tags: Tag[]) => {
    if (editRow != null) {
      setEditRow({ ...editRow, supplierTags: tags });
    } else {
      setAddTags(tags);
    }
  };

  const Fields = (): ReactNode => {
    return (
      <>
        <TextField
          variant="outlined"
          id="outlined-basic"
          name="id"
          label="Supplier's Id"
          disabled
          defaultValue={editRow ? editRow.id : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="companyName"
          label="Company Name"
          defaultValue={editRow ? editRow.companyName : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="contactPerson"
          label="Contact Person"
          defaultValue={editRow ? editRow.contactPerson : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="emailAddress"
          label="Email Address"
          defaultValue={editRow ? editRow.emailAddress : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="phoneNumber"
          label="Phone Number"
          defaultValue={editRow ? editRow.phoneNumber : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          id="outlined-select-type"
          name="address"
          label="Address"
          defaultValue={editRow ? editRow.address : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          id="outlined-select-type"
          name="tin"
          label="TIN Number (Optional)"
          defaultValue={editRow ? editRow.tin : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          id="outlined-select-type"
          name="status"
          label="Supplier Status"
          defaultValue={editRow ? editRow.status : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="moreInfo"
          multiline
          rows={4}
          label="More Information"
          defaultValue={editRow ? editRow.moreInfo : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <ChipInput
          styles={{ width: "25vw" }}
          onTagsChange={onTagsChange}
          searchTags={searchSupplierTags}
          label="Attach Tags eg. Urgent(This is an urgent supplier)"
          tags={editRow ? editRow.supplierTags : []}
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
    const supplier = await getSupplierById(id);
    if (supplier) setEditRow(supplier);
    setedit(true);
  };

  const exportToExcel = async () => {
    // @ts-expect-error : window.electron is resolved at build time
    if (window.electron) {
      const supplierExcelSheet = suppliers;

      // @ts-expect-error : window.electron is resolved at build time
      window.electron.exportExcel(supplierExcelSheet, "Suppliers");

      toast({
        title: "System Supplier Management",
        description: "Suppliers successfully exported to Excel.",
        className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
      });
    } else {
    }
  };

  const handleDelete = async (id: string) => {
    await deleteSupplier(
      id,
      () => {
        toast({
          title: "System Supplier Management",
          description: "Supplier successfully deleted.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchSuppliers(null, page);
      },
      () => {
        toast({
          title: "System Supplier Management",
          variant: "destructive",
          description: "An error occured. Supplier couldnt be deleted. ",
        });
        fetchSuppliers(null, page);
      }
    );
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setsubmitting(true);
    const formData = new FormData(event.target as HTMLFormElement);

    const data: supplierDto = {
      companyName: formData.get("companyName") as string,
      contactPerson: formData.get("contactPerson") as string,
      address: formData.get("address") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      emailAddress: formData.get("emailAddress") as string,
      tin: formData.get("tin") as string,
      status: formData.get("status") as string,
      moreInfo: formData.get("moreInfo") as string,
      supplierTags: AddTags,
    };

    createSupplier(
      data,
      () => {
        setsubmitting(false);
        toast({
          title: "System Supplier Management",
          description: "Supplier successfully created.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchSuppliers(null, page).then(() => {setSuppliers(suppliers)});
        setedit(false);
      },
      () => {
        setsubmitting(false);
        toast({
          title: "System Supplier Management",
          variant: "destructive",
          description: "An error occured . Supplier couldnt be added.",
        });
      }
    );
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setsubmitting(true);
    const formData = new FormData(event.target as HTMLFormElement);

    const data = {
      companyName: formData.get("companyName") as string,
      contactPerson: formData.get("contactPerson") as string,
      address: formData.get("address") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      emailAddress: formData.get("emailAddress") as string,
      tin: formData.get("tin") as string,
      status: formData.get("status") as string,
      moreInfo: formData.get("moreInfo") as string,
    };

    if (editRow == null) {
      return;
    }

    await updateSupplier(
      { ...editRow, ...data },
      () => {
        setsubmitting(false);
        toast({
          title: "System Supplier Management",
          description: `${editRow?.companyName} successfully updated`,
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchSuppliers(null, page);
        setedit(false);
      },
      () => {
        setsubmitting(false);
        toast({
          title: "System Supplier Management",
          variant: "destructive",
          description: "An error occured . Supplier couldnt be updated.",
        });
      }
    );
  };

  return (
    <div className="p-6 h-full">
      <h2 className="text-lg font-bold mb-4">Manage Business Suppliers</h2>
      <div className="flex justify-between items-center mb-4">
        <TextField
          id="outlined-select-type"
          name="searchsupplier"
          label="Search Suppliers"
          sx={{ width: "25vw" }}
          onChange={async (event) => {
            if (event.target.value.trim() != "") {
              if (event.target.value.trim().length >= 3) {
                await fetchSuppliers(
                  event.target.value.trim(),
                  page != 1 ? 1 : page
                );
              }
            } else {
              await fetchSuppliers(null, 1);
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon />
                </InputAdornment>
              ),
            },
          }}
          margin="normal"
        />

        <div className="space-x-4">
          <Button
            onClick={() => {
              setEditRow(null);
              setedit(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <i className="fas fa-plus mr-2"></i>Add
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <i className="fas fa-print mr-2"></i>Print
          </Button>
          <Button
            onClick={() => {
              exportToExcel();
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <i className="fas fa-file-excel mr-2"></i>Export To Excel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center flex-col h-80 w-full">
          <CircularProgress />
          <h3 className="mt-4">Loading Business Suppliers...</h3>
        </div>
      ) : (
        <div className="flex flex-col h-[80%] justify-between items-end">
          <Table className="flex-grow">
            {/* <TableCaption>A list of users and their details</TableCaption> */}
            <TableHeader>
              <TableRow>
                <TableHead>CompanyName</TableHead>
                <TableHead>ContactPerson</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers?.map((row) => (
                <TableRow
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    alert(row.id);
                  }}
                  key={row.id}
                >
                  <TableCell>{row.companyName}</TableCell>
                  <TableCell>{row.contactPerson}</TableCell>
                  <TableCell>{row.phoneNumber}</TableCell>
                  <TableCell>{row.emailAddress}</TableCell>
                  <TableCell>{row.address}</TableCell>
                  <TableCell>{toDDMMYYYY(row.addedAt)}</TableCell>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ height: 50, alignItems: "center" }}
                  >
                    {row.supplierTags?.slice(0, 2).map((tag, key) => (
                      <Chip
                        key={key}
                        label={tag.name}
                        color={"primary"}
                        style={{ color: GetColorFromLetters(tag.name) }}
                        variant="outlined"
                      />
                    ))}

                    {row.supplierTags?.length > 2 && (
                      <Chip
                        label={`+${row.supplierTags.length - 2}`}
                        variant="outlined"
                      />
                    )}
                  </Stack>

                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={"secondary"}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEdit(row.id);
                        }}
                      >
                        Edit
                      </Button>

                      <Dialog
                        heading="Delete Supplier"
                        description={`This will delete the supplier ${row.companyName} from the system.`}
                        continueButtonText="Delete"
                        cancelButtonText="Cancel"
                        triggerComponent={
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                            }}
                          >
                            Delete
                          </Button>
                        }
                        onContinue={() => handleDelete(row.id)}
                        onCancel={() => {}}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            count={pagination?.pages}
            variant="outlined"
            color="secondary"
            hideNextButton={pagination?.next == null}
            hidePrevButton={pagination?.previous == null}
            onChange={async (event, page) => {
              await fetchSuppliers(null, page);
            }}
          />
        </div>
      )}

      <Edit
        open={edit}
        Heading={editRow ? "UPDATE SUPPLIER" : "ADD SUPPLIER"}
        onSubmit={editRow ? handleUpdate : handleSave}
        toggleDrawer={toggleEditDrawer}
        Fields={Fields}
      />
    </div>
  );
};

export default page;
