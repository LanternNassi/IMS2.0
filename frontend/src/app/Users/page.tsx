"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect, ReactNode } from "react";
import { useUserStore, User, UserDto } from "@/store/useUserStore";

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
import { TextField, MenuItem } from "@mui/material";
import Edit from "@/components/Edit";
import CircularProgress from "@mui/material/CircularProgress";
import { useToast } from "@/hooks/use-toast"


const page = () => {
  const [editRow, setEditRow] = useState<User | null>(null);
  const [edit, setedit] = React.useState<boolean>(false);
  const { toast } = useToast()
  const { isLoading, createUser, fetchUsers, getUserById, deleteUser, updateUser, users } =
    useUserStore((state) => state);
  const [submitting, setsubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchUsers(null);
  } , []);

  const toggleEditDrawer = (newOpen: boolean) => {
    setedit(newOpen);
  };

  const Fields = (): ReactNode => {
    return (
      <>
        <TextField
          variant="outlined"
          id="outlined-basic"
          name="username"
          label="Username"
          defaultValue={editRow ? editRow.username : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="passwordHarsh"
          label="Password"
          defaultValue={editRow ? editRow.username : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          id="outlined-select-type"
          select
          name="gender"
          label="Gender"
          defaultValue={editRow ? editRow.gender : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        >
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
        </TextField>

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="telephone"
          label="Telephone"
          defaultValue={editRow ? editRow.telephone : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          label="email"
          name="email"
          defaultValue={editRow ? editRow.email : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          id="outlined-select-type"
          select
          name="role"
          label="Account Type"
          defaultValue={editRow ? editRow.role : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        >
          <MenuItem value="admin">admin</MenuItem>
          <MenuItem value="normal">normal</MenuItem>
        </TextField>
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
    const user = await getUserById(id);
    if (user) setEditRow(user);
    setedit(true);
  };

  const editUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editRow) {
      const formData = new FormData(event.target as HTMLFormElement);

      const updatedUser: UserDto = {
        username: formData.get("username") as string,
        passwordHash: formData.get("passwordHarsh") as string,
        email: formData.get("email") as string,
        gender: formData.get("gender") as "Male" | "Female",
        telephone: formData.get("telephone") as string,
        role: formData.get("role") as "admin" | "normal",
      };
      await updateUser(
        {...editRow , ...updatedUser},
        () => {
          toast({
            title: "System User Management",
            description: "User successfully updated.",
            className: "bg-primary text-black dark:bg-gray-700 dark:text-white"
          });
          fetchUsers(null)
          setedit(false)
        },
        () => {
          toast({
            title: "System User Management",
            variant: 'destructive',
            description: "An error occured. User couldnt be updated.",
          });
        }
      );
    }
  }

  const handleDelete = async (id: string) => {

    await deleteUser(id , () => {
      toast({
        title: "System User Management",
        description: "User successfully deleted.",
        className: "bg-primary text-black dark:bg-gray-700 dark:text-white"
      });
      fetchUsers(null)
    } , () => {
      toast({
        
        title: "System User Management",
        variant: 'destructive',
        description: "An error occured. User couldnt be deleted. ",
      });      
      fetchUsers(null)
    })
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setsubmitting(true)
    const formData = new FormData(event.target as HTMLFormElement);

    const data: UserDto = {
      username: formData.get("username") as string,
      passwordHash: formData.get("passwordHarsh") as string,
      email: formData.get("email") as string,
      gender: formData.get("gender") as "Male" | "Female",
      telephone: formData.get("telephone") as string,
      role: formData.get("role") as "admin" | "normal",
    };

    createUser(
      data,
      () => {
        setsubmitting(false);
        toast({
          title: "System User Management",
          description: "User successfully created.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white"
        });
        fetchUsers(null)
        setedit(false)
      },
      () => {
        setsubmitting(false);
        toast({
          title: "System User Management",
          variant : 'destructive',
          description: "An error occured . User couldnt be added.",
        });
      }
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold mb-4">Manage Users</h2>

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
          <h3 className="mt-4">Loading System Users...</h3>
        </div>
      ) : (
        <Table>
          {/* <TableCaption>A list of users and their details</TableCaption> */}
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Telephone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{`${(row.id).slice(0,6)}...`}</TableCell>
                <TableCell>{row.username}</TableCell>
                <TableCell>{row.gender}</TableCell>
                <TableCell>{row.telephone}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>{row.addedBy}</TableCell>
                <TableCell>{row.role}</TableCell>
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

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(row.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Edit
        open={edit}
        Heading={editRow ? "UPDATE USER" : "ADD USER"}
        onSubmit={editRow ? editUser : handleSave}
        toggleDrawer={toggleEditDrawer}
        Fields={Fields}
      />
    </div>
  );
};

export default page;
