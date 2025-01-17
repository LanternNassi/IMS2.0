"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useEffect, ReactNode } from "react";
import { useCategoriesStore , categoryDto , category } from "@/store/useCategoryStore";
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

const page = () => {
  const [editRow, setEditRow] = useState<category | null>(null);
  const [edit, setedit] = React.useState<boolean>(false);
  const { toast } = useToast();
  const {
    isLoading,
    createCategory,
    fetchCategories,
    getCategoryById,
    deleteCategory,
    updateCategory,
    categories,
  } = useCategoriesStore((state) => state);
  const [submitting, setsubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchCategories(null);
  }, []);

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
          label="Category Id"
          disabled
          defaultValue={editRow ? editRow.id : ""}
          sx={{ width: "25vw" }}
          margin="normal"
        />

        <TextField
          variant="outlined"
          id="outlined-basic"
          name="name"
          label="Category Name"
          defaultValue={editRow ? editRow.name : ""}
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
    const category = await getCategoryById(id);
    if (category) setEditRow(category);
    setedit(true);
  };

  const editCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editRow) {
      const formData = new FormData(event.target as HTMLFormElement);

      const updatedCategory: categoryDto = {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
      };
      await updateCategory(
        { ...editRow, ...updatedCategory },
        () => {
          toast({
            title: "System Category Management",
            description: "Category successfully updated.",
            className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
          });
          fetchCategories(null);
          setedit(false);
        },
        () => {
          toast({
            title: "System Category Management",
            variant: "destructive",
            description: "An error occured. Category couldnt be updated.",
          });
        }
      );
    }
  };

  const handleDelete = async (id: string) => {
    await deleteCategory(
      id,
      () => {
        toast({
          title: "System Category Management",
          description: "Category successfully deleted.",
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchCategories(null);
      },
      () => {
        toast({
          title: "System Category Management",
          variant: "destructive",
          description: "An error occured. Categories couldnt be deleted. ",
        });
        fetchCategories(null);
      }
    );
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setsubmitting(true);
    const formData = new FormData(event.target as HTMLFormElement);

    const data: categoryDto = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
    };

    createCategory(
      data,
      () => {
        setsubmitting(false);
        toast({
          title: "System Category Management",
          description: `Category ${data.name} successfully added.`,
          className: "bg-primary text-black dark:bg-gray-700 dark:text-white",
        });
        fetchCategories(null);
        setedit(false);
      },
      () => {
        setsubmitting(false);
        toast({
          title: "System Category Management",
          variant: "destructive",
          description: "An error occured . Category couldnt be added.",
        });
      }
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold mb-4">Manage Product Categories</h2>

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
          <h3 className="mt-4">Loading Product Categories...</h3>
        </div>
      ) : (
        <Table>
          {/* <TableCaption>A list of users and their details</TableCaption> */}
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date Added</TableHead>
              <TableHead>Date Updated</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{`${row.id.slice(0, 6)}...`}</TableCell>
                <TableCell>{row.name}</TableCell>
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
        Heading={editRow ? "UPDATE CATEGORY" : "ADD CATEGORY"}
        onSubmit={editRow ? editCategory : handleSave}
        toggleDrawer={toggleEditDrawer}
        Fields={Fields}
      />
    </div>
  );
};

export default page;
