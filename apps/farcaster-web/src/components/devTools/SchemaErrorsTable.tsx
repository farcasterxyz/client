import React from 'react';

const SchemaErrorsTable = ({ errors }: { errors: string[] | undefined }) => {
  //    NOTE: This should never really happen, but it's here for safety.
  const displayErrors =
    errors && errors.length > 0
      ? errors
      : ['Schema validation failed but no specific errors were provided'];

  return (
    <div className="w-full rounded-lg border border-faint">
      <div className="flex w-full flex-col">
        <div className="flex border-b bg-danger border-faint">
          <div className="w-full p-4 text-left text-sm font-medium">
            ⚠️ Errors
          </div>
        </div>
        <div className="flex flex-col">
          {displayErrors.map((error, index) => (
            <div key={index} className="flex border-b border-faint">
              <div className="w-full p-4 text-sm text-danger">{error}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { SchemaErrorsTable };
