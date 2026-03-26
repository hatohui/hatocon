import React from "react";

const AdminLayout = ({
  children,
  form,
}: {
  children: React.ReactNode;
  form: React.ReactNode;
}) => {
  return (
    <div>
      {children}
      {form}
    </div>
  );
};

export default AdminLayout;
