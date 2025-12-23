import Drawer from "@mui/material/Drawer";
import PropTypes from "prop-types";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import React, { ReactNode } from "react";

interface Props {
    open:boolean;
    Heading:string;
    Fields:()=>ReactNode;
    toggleDrawer:(e : boolean)=>void;
    onSubmit:(e: React.FormEvent<HTMLFormElement>)=>void
}

export default function Edit({
  open,
  Heading,
  Fields,
  toggleDrawer,
  onSubmit,
} : Props) {
  return (
    <Drawer
      disableAutoFocus
      anchor={"right"}
      open={open}
      onClose={() => {
        toggleDrawer(false);
      }}
    >
      <Box
        sx={{
          width: { xs: '70vw', sm: '350px', md: '400px', lg: '450px' },
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header - Fixed height */}
        <Box
          className="bg-primary dark:bg-primary-dark"
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px 0",
            flexShrink: 0,
          }}
        >
          <Typography
            sx={{ 
              fontSize: { xs: '16px', sm: '17px' }, 
              fontWeight: "bold",
              marginBottom: '12px'
            }}
            variant="h6"
          >
            {Heading}
          </Typography>
          <Divider sx={{ width: '90%' }} />
        </Box>

        {/* Form - Scrollable content */}
        <Box
          component="form"
          onSubmit={(event) => {
            onSubmit(event);
          }}
          noValidate
          autoComplete="off"
          className="bg-primary dark:bg-primary-dark text-black dark:text-white"
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexGrow: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "16px",
            paddingTop: "24px",
            gap: "8px",
            // Ensure proper scrolling on all platforms
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {Fields()}
        </Box>
      </Box>
    </Drawer>
  );
}

Edit.propTypes = {
  open: PropTypes.string.isRequired,
  Fields: PropTypes.node.isRequired,
  Heading: PropTypes.string.isRequired,
  toggleDrawer: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};