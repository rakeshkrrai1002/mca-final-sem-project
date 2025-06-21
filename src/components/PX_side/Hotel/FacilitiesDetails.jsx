import React from 'react';

const FacilitiesDetails = ({ facilities }) => {
  return (
    <div className="my-4 border-t pt-4">
      <h2 className="text-lg font-bold text-black mb-2">Facilities</h2>
      <div className="flex flex-wrap gap-2">
        {facilities.map((facility, index) => (
          <span
            key={index}
            className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-lg text-gray-700 font-semibold text-sm"
          >
            <i className="fas fa-check-circle text-ezzstay-base"></i>
            <span>{facility}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default FacilitiesDetails;