"use client";

import { useRef } from "react";

import { ui } from "@/src/lib/ui";

export type SortOption = {
  value: string;
  label: string;
};

type SortControlProps = {
  action?: string;
  selectId: string;
  currentSort: string;
  options: SortOption[];
  hiddenFields?: Record<string, string>;
  onChange?: (value: string) => void;
  label?: string;
  paramName?: string;
};

function SortSelect({
  selectId,
  currentSort,
  options,
  onChange,
  name,
  label,
  formMode = false,
}: Readonly<{
  selectId: string;
  currentSort: string;
  options: SortOption[];
  onChange?: (value: string) => void;
  name?: string;
  label: string;
  formMode?: boolean;
}>) {
  return (
    <>
      <label htmlFor={selectId} className={ui.label}>
        {label}
      </label>
      <select
        id={selectId}
        name={name}
        {...(formMode
          ? { defaultValue: currentSort }
          : { value: currentSort })}
        className={ui.select}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}

export default function SortControl({
  action,
  selectId,
  currentSort,
  options,
  hiddenFields = {},
  onChange,
  label = "Sort",
  paramName = "sort",
}: Readonly<SortControlProps>) {
  const formRef = useRef<HTMLFormElement>(null);

  if (onChange) {
    return (
      <div className="flex items-center gap-2">
        <SortSelect
          selectId={selectId}
          currentSort={currentSort}
          options={options}
          onChange={onChange}
          label={label}
        />
      </div>
    );
  }

  if (!action) {
    throw new Error("SortControl requires action when onChange is not provided.");
  }

  return (
    <form ref={formRef} action={action} method="get" className="flex items-center gap-2">
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <SortSelect
        selectId={selectId}
        currentSort={currentSort}
        options={options}
        name={paramName}
        label={label}
        formMode
        onChange={() => formRef.current?.requestSubmit()}
      />
      <noscript>
        <button type="submit" className={ui.pillSecondary}>
          Apply
        </button>
      </noscript>
    </form>
  );
}
