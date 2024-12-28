"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, ReactNode } from "react";

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

import { TextField, MenuItem, Button as MuiButton } from "@mui/material";
import Edit from "@/components/Edit";

type UserRow = {
  id: number;
  user: string;
  gender: string;
  telephone: string;
  email: string;
  addedBy: string;
  type: string;
  serverId: number;
};

const page = () => {
  const [data, setData] = useState<UserRow[]>([
    {
      id: 3,
      user: "User",
      gender: "Female",
      telephone: "123-456-7890",
      email: "user@example.com",
      addedBy: "Nassim",
      type: "admin",
      serverId: 0,
    },
    {
      id: 4,
      user: "Nessim",
      gender: "Male",
      telephone: "234-567-8901",
      email: "nessim@example.com",
      addedBy: "User",
      type: "admin",
      serverId: 1,
    },
    {
      id: 1004,
      user: "Kayondo",
      gender: "Male",
      telephone: "345-678-9012",
      email: "kayondo@example.com",
      addedBy: "User",
      type: "normal",
      serverId: 2,
    },
    {
      id: 2004,
      user: "John",
      gender: "Male",
      telephone: "456-789-0123",
      email: "john@example.com",
      addedBy: "User",
      type: "normal",
      serverId: 3,
    },
    {
      id: 3004,
      user: "Werps",
      gender: "Male",
      telephone: "567-890-1234",
      email: "werps@example.com",
      addedBy: "User",
      type: "normal",
      serverId: 4,
    },
  ]);

  const [editRow, setEditRow] = useState<UserRow | null>(null);
  const [edit, setedit] = React.useState<boolean>(false);

  const toggleEditDrawer = (newOpen: boolean) => {
    setedit(newOpen);
  };

  const Fields = (): ReactNode => {
    return (
      <>
        <TextField
          variant="outlined"
          id="outlined-basic"
          label="Username"
          defaultValue={editRow? editRow.user : ""}
          sx={{ width: "25vw"}}
          margin="normal"
        />

        <TextField
          id="outlined-select-type"
          select
          label="Gender"
          defaultValue={editRow? editRow.gender : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        >
          <MenuItem value="Male">Male</MenuItem>
          <MenuItem value="Female">Female</MenuItem>
        </TextField>

        <TextField
          variant="outlined"
          id="outlined-basic"
          label="Telephone"
          defaultValue={editRow? editRow.telephone : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          label="email"
          defaultValue={editRow? editRow.email : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          id="outlined-select-type"
          select
          label="Account Type"
          defaultValue={editRow? editRow.type : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        >
          <MenuItem value="admin">admin</MenuItem>
          <MenuItem value="normal">normal</MenuItem>
        </TextField>
        <MuiButton
          onClick={handleSave}
          variant="contained"
          color="primary"
          sx={{ width: "25vw" }}
        >
          Save
        </MuiButton>
      </>
    );
  };

  const handleEdit = (id: number) => {
    const row = data.find((d) => d.id === id);
    if (row) setEditRow(row);
    setedit(true)
  };

  const handleDelete = (id: number) => {
    setData(data.filter((row) => row.id !== id));
  };

  const handleSave = () => {
    if (editRow) {
      setData(data.map((row) => (row.id === editRow.id ? editRow : row)));
      setEditRow(null); // Close the sheet
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold mb-4">Manage Users</h2>

        <div className="space-x-4">
          <Button onClick={()=>{
            setEditRow(null)
            setedit(true)
          }} className="bg-blue-600 hover:bg-blue-700">
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
            <TableHead>Server ID</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.id}</TableCell>
              <TableCell>{row.user}</TableCell>
              <TableCell>{row.gender}</TableCell>
              <TableCell>{row.telephone}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{row.addedBy}</TableCell>
              <TableCell>{row.type}</TableCell>
              <TableCell>{row.serverId}</TableCell>
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
        <Edit
          open={edit}
          Heading={editRow? ("UPDATE USER") : ("ADD USER")}
          onSubmit={() => {}}
          toggleDrawer={toggleEditDrawer}
          Fields={Fields}
        />
    </div>
  );
};

export default page;
