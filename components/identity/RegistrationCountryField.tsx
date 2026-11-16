"use client";

import { useEffect, useState } from "react";
import { registrationCountryChoices } from "@/lib/identity/registration-region";
import { t } from "@/lib/i18n/translate";

type RegistrationCountryFieldProps = {
  id: string;
  value: string;
  onChange: (countryCode: string) => void;
  disabled?: boolean;
  labelClassName?: string;
  selectClassName?: string;
  hintClassName?: string;
};

export default function RegistrationCountryField({
  id,
  value,
  onChange,
  disabled = false,
  labelClassName,
  selectClassName,
  hintClassName,
}: RegistrationCountryFieldProps) {
  const [choices, setChoices] = useState([{ code: "BR", name: t("registration.country.brazil") }]);

  useEffect(() => {
    setChoices(registrationCountryChoices());
  }, []);

  return (
    <div>
      <label className={labelClassName} htmlFor={id}>
        {t("registration.country.label")}
      </label>
      <select
        id={id}
        className={selectClassName}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {choices.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </select>
      {value !== "BR" ? (
        <p className={hintClassName} role="status">
          {t("registration.country.unavailable")}
        </p>
      ) : null}
    </div>
  );
}
