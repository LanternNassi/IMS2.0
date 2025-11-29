"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect, ReactNode } from "react";
import { useStoresStore, store, storeDto } from "@/store/useStoresStore";
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
import Edit from "@/components/Edit";
import CircularProgress from "@mui/material/CircularProgress";
import { useToast } from "@/hooks/use-toast";
import Dialog from "@/components/Dialog";
import { set } from "date-fns";

const page = () => {
  const [editRow, setEditRow] = useState<store | null>(null);
  const [edit, setedit] = React.useState<boolean>(false);
  const { toast } = useToast();
  const {
    isLoading,
    createStore,
    fetchStores,
    getStoreById,
    deleteStore,
    updateStore,
    setStores,
    stores,
  } = useStoresStore((state) => state);
  const [submitting, setsubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchStores(null).then(data => {
      setStores(data || []);
    })
  }, [fetchStores]);

  const toggleEditDrawer = (newOpen: boolean) => {
    setedit(newOpen);
  };

  const Fields = (): ReactNode => {
    return (
      <>
        <TextField
          variant="outlined"
          id="outlined-basic"
          name="id"
          label="Store Id"
          disabled
          defaultValue={editRow ? editRow.id : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="name"
          label="Store Name"
          defaultValue={editRow ? editRow.name : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          id="outlined-select-type"
          name="address"
          label="Store Address"
          defaultValue={editRow ? editRow.address : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="description"
          multiline
          rows={4}
          label="Store Description"
          defaultValue={editRow ? editRow.description : ""}
          sx={{ width: "25vw" }}
          margin="normal"
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
    const store = await getStoreById(id);
    if (store) setEditRow(store);
    setedit(true);
  };

  const editStore = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editRow) {
      const formData = new FormData(event.target as HTMLFormElement);

      const updatedStore: storeDto = {
        name: formData.get("name") as string,
        address: formData.get("address") as string,
        description: formData.get("description") as string,
      };
      await updateStore(
        { ...editRow, ...updatedStore },
        () => {
          toast({
            title: "System Store Management",
            description: "Store successfully updated.",
            className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
          });
          fetchStores(null).then(data => {
            setStores(data || []);
          });
          setedit(false);
        },
        () => {
          toast({
            title: "System Store Management",
            variant: "destructive",
            description: "An error occured. User couldnt be updated.",
          });
        }
      );
    }
  };

  const handleDelete = async (id: string) => {
    await deleteStore(
      id,
      () => {
        toast({
          title: "System Store Management",
          description: "Store successfully deleted.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchStores(null).then(data => {
          setStores(data || []);
        });
      },
      () => {
        toast({
          title: "System Store Management",
          variant: "destructive",
          description: "An error occured. Stores couldnt be deleted. ",
        });
        fetchStores(null).then(data => {
          setStores(data || []);
        });
      }
    );
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setsubmitting(true);
    const formData = new FormData(event.target as HTMLFormElement);

    const data: storeDto = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
      description: formData.get("description") as string,
    };

    createStore(
      data,
      () => {
        setsubmitting(false);
        toast({
          title: "System Store Management",
          description: "Store successfully created.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchStores(null).then(data => {
          setStores(data || []);
        });
        setedit(false);
      },
      () => {
        setsubmitting(false);
        toast({
          title: "System Store Management",
          variant: "destructive",
          description: "An error occured . Store couldnt be added.",
        });
      }
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold mb-4">Manage Business Stores</h2>

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
          <Button className="bg-blue-600 hover:bg-blue-700">
            <i className="fas fa-file-excel mr-2"></i>Export To Excel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center flex-col h-80 w-full">
          <CircularProgress />
          <h3 className="mt-4">Loading Business Stores...</h3>
        </div>
      ) : (
        <Table>
          {/* <TableCaption>A list of users and their details</TableCaption> */}
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>Date Updated</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stores?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{`${row.id.slice(0, 6)}...`}</TableCell>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.address}</TableCell>
                <TableCell>{row.description.length > 40 ? `${row.description.slice(0, 40)}...` : row.description}</TableCell>
                <TableCell>{toDDMMYYYY(row.addedAt)}</TableCell>
                <TableCell>{toDDMMYYYY(row.updatedAt)}</TableCell>
                <TableCell>{row.addedBy}</TableCell>
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
                      heading="Delete Storage"
                      description={`This will delete the Store ${row.name} softly from the system.`}
                      continueButtonText="Delete"
                      cancelButtonText="Cancel"
                      triggerComponent = {
                        <Button
                          size="sm"
                          variant="destructive"
                        >
                          Delete
                        </Button>
                      }
                      onContinue={() => handleDelete(row.id)}
                      onCancel={()=>{}}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Edit
        open={edit}
        Heading={editRow ? "UPDATE STORE" : "ADD STORE"}
        onSubmit={editRow ? editStore : handleSave}
        toggleDrawer={toggleEditDrawer}
        Fields={Fields}
      />
    </div>
  );
};

export default page;
