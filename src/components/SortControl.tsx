"use client";

import { useRef } from "react";

import { ui } from "@/src/lib/ui";

export type SortOption = {
  value: string;
  label: string;
};

type SortControlProps = {
  action: string;
  selectId: string;
  currentSort: string;
  options: SortOption[];
  hiddenFields?: Record<string, string>;
};

export default function SortControl({
  action,
  selectId,
  currentSort,
  options,
  hiddenFields = {},
}: Readonly<SortControlProps>) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} method="get" className="flex items-center gap-2">
      {Object.entries(hiddenFields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <label htmlFor={selectId} className={ui.label}>
        Sort
      </label>
      <select
        id={selectId}
        name="sort"
        defaultValue={currentSort}
        className={ui.select}
        onChange={() => formRef.current?.requestSubmit()}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <noscript>
        <button type="submit" className={ui.pillSecondary}>
          Apply
        </button>
      </noscript>
    </form>
  );
}
