import React from "react";
import SideCategoryBar from "./_components/SideCategoryBar";

const SearchLayout = ({ children }) => {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-4">
      <aside className="hidden md:block">
        <SideCategoryBar />
      </aside>
      <div className="md:col-span-3">{children}</div>
    </div>
  );
};

export default SearchLayout;
