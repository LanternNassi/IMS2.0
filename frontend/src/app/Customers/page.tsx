"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect, ReactNode } from "react";
import {
  useCustomerStore,
  customer,
  customerDto,
} from "@/store/useCustomerStore";
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
import Pagination from '@mui/material/Pagination';
import Edit from "@/components/Edit";
import CircularProgress from "@mui/material/CircularProgress";
import { useToast } from "@/hooks/use-toast";
import Dialog from "@/components/Dialog";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import {GetColorFromLetters} from "@/Utils/Usuals"; 
import ChipInput , {Tag} from "@/components/ChipInput";
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import { defaultProperties } from "@/Utils/DefaultProperties";


const page = () => {
  const [editRow, setEditRow] = useState<customer | null>(null);
  const [edit, setedit] = React.useState<boolean>(false);
  const [AddTags, setAddTags] = React.useState<Tag[]>([])
  const [page] = React.useState<number>(1);

  const { toast } = useToast();
  const {
    fetchCustomers,
    getCustomerById,
    deleteCustomer,
    createCustomer,
    searchCustomerTags,
    updateCustomer,
    isLoading,
    customers,
    pagination
  } = useCustomerStore();
  const [submitting, setsubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchCustomers(null, page);
  }, []);

  interface CustomersExcel extends defaultProperties {
    id: string;
    name : string;
    customerType : string;
    address : string;
    phone : string;
    email : string;
    accountNumber : string;
    moreInfo : string;
  }

  const toggleEditDrawer = (newOpen: boolean) => {
    setedit(newOpen);
  };

  const onTagsChange = (tags: Tag[]) => {
    if (editRow != null){
        setEditRow({...editRow , customerTags : tags})
    }else{
        setAddTags(tags)
    }
  }


  const Fields = (): ReactNode => {
    return (
      <>
        <TextField
          variant="outlined"
          id="outlined-basic"
          name="id"
          label="Customer's Id"
          disabled
          defaultValue={editRow ? editRow.id : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="name"
          label="Full Name"
          defaultValue={editRow ? editRow.name : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="customerType"
          label="Customer Type"
          defaultValue={editRow ? editRow.customerType : ""}
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
          name="phone"
          label="Telephone"
          defaultValue={editRow ? editRow.phone : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          id="outlined-select-type"
          name="email"
          label="Email Address"
          defaultValue={editRow ? editRow.email : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          id="outlined-select-type"
          name="accountNumber"
          label="Account Number"
          defaultValue={editRow ? editRow.accountNumber : ""}
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
          styles = {{width : "25vw"}}
          onTagsChange={onTagsChange} 
          searchTags={searchCustomerTags}
          label="Attach Tags eg. Urgent(This is an urgent customer)"
          tags={editRow ? editRow.customerTags : []}
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
    const customer = await getCustomerById(id);
    if (customer) setEditRow(customer);
    setedit(true);
  };

  const exportToExcel = async () => {

    // @ts-expect-error : window.electron is resolved at build time
    if (window.electron) {

      const customerExcelSheet : CustomersExcel[] | null  = customers ;

      // @ts-expect-error : window.electron is resolved at build time
      window.electron.exportExcel(customerExcelSheet , 'Customers');

      toast({
        title: "System Customer Management",
        description: "Customers successfully exported to Excel.",
        className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
      });

    } else {

    }
      
  }

  const handleDelete = async (id: string) => {
    await deleteCustomer(
      id,
      () => {
        toast({
          title: "System Customer Management",
          description: "Customer successfully deleted.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchCustomers(null, page);
      },
      () => {
        toast({
          title: "System Customer Management",
          variant: "destructive",
          description: "An error occured. Customer couldnt be deleted. ",
        });
        fetchCustomers(null, page);
      }
    );
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setsubmitting(true);
    const formData = new FormData(event.target as HTMLFormElement);

    const data: customerDto = {
      name: formData.get("name") as string,
      customerType: formData.get("customerType") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      accountNumber: formData.get("accountNumber") as string,
      moreInfo: formData.get("moreInfo") as string,
      customerTags: AddTags,
    };

    createCustomer(
      data,
      () => {
        setsubmitting(false);
        toast({
          title: "System Customer Management",
          description: "Customer successfully created.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchCustomers(null, page);
        setedit(false);
      },
      () => {
        setsubmitting(false);
        toast({
          title: "System Customer Management",
          variant: "destructive",
          description: "An error occured . Customer couldnt be added.",
        });
      }
    );
  };

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setsubmitting(true);
    const formData = new FormData(event.target as HTMLFormElement);

    const data = {
      name: formData.get("name") as string,
      customerType: formData.get("customerType") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      accountNumber: formData.get("accountNumber") as string,
      moreInfo: formData.get("moreInfo") as string,
    };

    if (editRow == null) {
      return ;
    }

    await updateCustomer(
      {...editRow , ...data},
      () => {
        setsubmitting(false);
        toast({
          title: "System Customer Management",
          description: `${editRow?.name} successfully updated`,
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchCustomers(null, page);
        setedit(false);
      },
      () => {
        setsubmitting(false);
        toast({
          title: "System Customer Management",
          variant: "destructive",
          description: "An error occured . Customer couldnt be updated.",
        });
      }
    );
  };

  return (
    <div className="p-6 h-full">
      <h2 className="text-lg font-bold mb-4">Manage Business Customers</h2>
      <div className="flex justify-between items-center mb-4">

        <TextField
          id="outlined-select-type"
          name="searchcustomer"
          label="Search Customers"
          sx={{ width: "25vw" }}
          onChange={async (event) => {
            if (event.target.value.trim() != ""){
                if (event.target.value.trim().length >= 3 ){
                  await fetchCustomers(event.target.value.trim() , page != 1 ? 1 : page )
                }
            }else{
              await fetchCustomers(null , 1)
            }
          }}
          slotProps={{
            input: {
              startAdornment: 
              <InputAdornment position="start">
                  <SearchOutlinedIcon/>
              </InputAdornment>
            }
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
          <Button onClick={() => {exportToExcel()}} className="bg-blue-600 hover:bg-blue-700">
            <i className="fas fa-file-excel mr-2"></i>Export To Excel
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center flex-col h-80 w-full">
          <CircularProgress />
          <h3 className="mt-4">Loading Business Customers...</h3>
        </div>
      ) : (
        <div className="flex flex-col h-[80%] justify-between items-end">
          <Table className="flex-grow">
            {/* <TableCaption>A list of users and their details</TableCaption> */}
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>CustomerType</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.customerType}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.address}</TableCell>
                  <TableCell>{toDDMMYYYY(row.addedAt)}</TableCell>
                  <Stack direction="row" spacing={1} sx={{height : 50 , alignItems : 'center'}}>
                  {
                    row.customerTags?.slice(0,2).map((tag , key) => (
                        <Chip key={key} label={tag.name} color={"primary"} style={{color : GetColorFromLetters(tag.name)}} variant="outlined" />
                    ))
                  }

                  {row.customerTags?.length > 2 && (
                      <Chip label={`+${row.customerTags.length - 2}`} variant="outlined" />
                    )}
                  </Stack>
                    
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
                        description={`This will delete the customer ${row.name} softly from the system.`}
                        continueButtonText="Delete"
                        cancelButtonText="Cancel"
                        triggerComponent={
                          <Button size="sm" variant="destructive">
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
            onChange={async (event, page ) => {
                await fetchCustomers(null , page)
            }}
          />
        </div>

      )}

      <Edit
        open={edit}
        Heading={editRow ? "UPDATE CUSTOMER" : "ADD CUSTOMER"}
        onSubmit={editRow ? handleUpdate : handleSave}
        toggleDrawer={toggleEditDrawer}
        Fields={Fields}
      />
    </div>
  );
};

export default page;
