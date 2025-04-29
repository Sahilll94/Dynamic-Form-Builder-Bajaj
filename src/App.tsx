import { useState } from "react";

interface User {
  rollNumber: string;
  name: string;
}

interface FormField {
  fieldId: string;
  type:
    | "text"
    | "tel"
    | "email"
    | "textarea"
    | "date"
    | "dropdown"
    | "radio"
    | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  dataTestId: string;
  validation?: {
    message: string;
  };
  options?: Array<{
    value: string;
    label: string;
    dataTestId?: string;
  }>;
  maxLength?: number;
  minLength?: number;
}

interface FormSection {
  sectionId: number;
  title: string;
  description: string;
  fields: FormField[];
}

interface FormData {
  formTitle: string;
  formId: string;
  version: string;
  sections: FormSection[];
}

interface FormResponse {
  message: string;
  form: FormData;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleLogin = async (userData: User) => {
    setIsLoading(true);
    setError(null);

    try {
      const userResponse = await fetch(
        "https://dynamic-form-generator-9rl7.onrender.com/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      if (!userResponse.ok) {
        throw new Error("Failed to register user");
      }

      const formResponse = await fetch(
        `https://dynamic-form-generator-9rl7.onrender.com/get-form?rollNumber=${userData.rollNumber}`
      );

      if (!formResponse.ok) {
        throw new Error("Failed to fetch form data");
      }

      const data: FormResponse = await formResponse.json();

      setUser(userData);
      setFormData(data.form);
      setIsLoggedIn(true);

      const initialValues: Record<string, any> = {};
      data.form.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.type === "checkbox") {
            initialValues[field.fieldId] = false;
          } else {
            initialValues[field.fieldId] = "";
          }
        });
      });

      setFormValues(initialValues);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    if (formErrors[fieldId]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateField = (field: FormField, value: any): string | null => {
    if (
      field.required &&
      (value === "" || value === null || value === undefined)
    ) {
      return field.validation?.message || "This field is required";
    }

    if (
      field.minLength &&
      typeof value === "string" &&
      value.length < field.minLength
    ) {
      return `Minimum length is ${field.minLength} characters`;
    }

    if (
      field.maxLength &&
      typeof value === "string" &&
      value.length > field.maxLength
    ) {
      return `Maximum length is ${field.maxLength} characters`;
    }

    if (field.type === "email" && value && !/^\S+@\S+\.\S+$/.test(value)) {
      return "Please enter a valid email address";
    }

    if (field.type === "tel" && value && !/^\d{10}$/.test(value)) {
      return "Please enter a valid 10-digit phone number";
    }

    return null;
  };

  const validateSection = (sectionIndex: number): boolean => {
    if (!formData) return false;

    const section = formData.sections[sectionIndex];
    const newErrors: Record<string, string> = {};
    let isValid = true;

    section.fields.forEach((field) => {
      const error = validateField(field, formValues[field.fieldId]);
      if (error) {
        newErrors[field.fieldId] = error;
        isValid = false;
      }
    });

    setFormErrors(newErrors);
    return isValid;
  };

  const handleNextSection = () => {
    if (!formData) return;

    const isValid = validateSection(currentSection);

    if (isValid) {
      setCurrentSection((prev) =>
        Math.min(prev + 1, formData.sections.length - 1)
      );
    }
  };

  const handlePrevSection = () => {
    setCurrentSection((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    if (!formData) return;

    const isValid = validateSection(currentSection);

    if (isValid) {
      console.log("Submitted form values:", formValues);
    }
  };

  const renderField = (field: FormField) => {
    const error = formErrors[field.fieldId];

    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "date":
        return (
          <div className="mb-4" key={field.fieldId}>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor={field.fieldId}
            >
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              id={field.fieldId}
              type={field.type}
              data-testid={field.dataTestId}
              className={`shadow appearance-none border ${
                error ? "border-red-500" : "border-gray-300"
              } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              placeholder={field.placeholder}
              value={formValues[field.fieldId] || ""}
              onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
              maxLength={field.maxLength}
              minLength={field.minLength}
            />
            {error && (
              <p className="text-red-500 text-xs italic mt-1">{error}</p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div className="mb-4" key={field.fieldId}>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor={field.fieldId}
            >
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              id={field.fieldId}
              data-testid={field.dataTestId}
              className={`shadow appearance-none border ${
                error ? "border-red-500" : "border-gray-300"
              } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              placeholder={field.placeholder}
              value={formValues[field.fieldId] || ""}
              onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
              maxLength={field.maxLength}
              minLength={field.minLength}
              rows={4}
            />
            {error && (
              <p className="text-red-500 text-xs italic mt-1">{error}</p>
            )}
          </div>
        );

      case "dropdown":
        return (
          <div className="mb-4" key={field.fieldId}>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor={field.fieldId}
            >
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              id={field.fieldId}
              data-testid={field.dataTestId}
              className={`shadow appearance-none border ${
                error ? "border-red-500" : "border-gray-300"
              } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              value={formValues[field.fieldId] || ""}
              onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
            >
              <option value="">Select an option</option>
              {field.options?.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  data-testid={option.dataTestId}
                >
                  {option.label}
                </option>
              ))}
            </select>
            {error && (
              <p className="text-red-500 text-xs italic mt-1">{error}</p>
            )}
          </div>
        );

      case "radio":
        return (
          <div className="mb-4" key={field.fieldId}>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {field.label}{" "}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="mt-2">
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center mb-1">
                  <input
                    id={`${field.fieldId}-${option.value}`}
                    type="radio"
                    name={field.fieldId}
                    data-testid={
                      option.dataTestId || `${field.dataTestId}-${option.value}`
                    }
                    value={option.value}
                    checked={formValues[field.fieldId] === option.value}
                    onChange={() =>
                      handleInputChange(field.fieldId, option.value)
                    }
                    className="mr-2"
                  />
                  <label
                    htmlFor={`${field.fieldId}-${option.value}`}
                    className="text-gray-700"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
            {error && (
              <p className="text-red-500 text-xs italic mt-1">{error}</p>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div className="mb-4" key={field.fieldId}>
            <div className="flex items-center">
              <input
                id={field.fieldId}
                type="checkbox"
                data-testid={field.dataTestId}
                checked={!!formValues[field.fieldId]}
                onChange={(e) =>
                  handleInputChange(field.fieldId, e.target.checked)
                }
                className="mr-2"
              />
              <label htmlFor={field.fieldId} className="text-gray-700">
                {field.label}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </label>
            </div>
            {error && (
              <p className="text-red-500 text-xs italic mt-1">{error}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const renderSection = (section: FormSection, index: number) => {
    const isLastSection = formData && index === formData.sections.length - 1;

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-2">{section.title}</h2>
        <p className="text-gray-600 mb-4">{section.description}</p>

        <div className="mb-6">
          {section.fields.map((field) => renderField(field))}
        </div>

        <div className="flex justify-between">
          {index > 0 && (
            <button
              type="button"
              onClick={handlePrevSection}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Previous
            </button>
          )}

          {isLastSection ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-auto"
            >
              Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextSection}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ml-auto"
            >
              Next
            </button>
          )}
        </div>
      </div>
    );
  };

  const LoginForm = () => {
    const [rollNumber, setRollNumber] = useState("");
    const [name, setName] = useState("");
    const [loginErrors, setLoginErrors] = useState({
      rollNumber: "",
      name: "",
    });

    const validateLoginForm = (): boolean => {
      const errors = { rollNumber: "", name: "" };
      let isValid = true;

      if (!rollNumber.trim()) {
        errors.rollNumber = "Roll Number is required";
        isValid = false;
      }

      if (!name.trim()) {
        errors.name = "Name is required";
        isValid = false;
      }

      setLoginErrors(errors);
      return isValid;
    };

    const handleLoginSubmit = (e: React.MouseEvent) => {
      e.preventDefault();

      if (validateLoginForm()) {
        handleLogin({ rollNumber, name });
      }
    };

    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Dynamic Form Builder
          </h2>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="rollNumber"
            >
              Enter Roll Number <span className="text-red-500">*</span>
            </label>
            <input
              className={`shadow appearance-none border ${
                loginErrors.rollNumber ? "border-red-500" : "border-gray-300"
              } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              id="rollNumber"
              type="text"
              placeholder="roll number"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              data-testid="roll-number-input"
            />
            {loginErrors.rollNumber && (
              <p className="text-red-500 text-xs italic mt-1">
                {loginErrors.rollNumber}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="name"
            >
              Enter your Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`shadow appearance-none border ${
                loginErrors.name ? "border-red-500" : "border-gray-300"
              } rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
              id="name"
              type="text"
              placeholder="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="name-input"
            />
            {loginErrors.name && (
              <p className="text-red-500 text-xs italic mt-1">
                {loginErrors.name}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              type="button"
              onClick={handleLoginSubmit}
              disabled={isLoading}
              data-testid="login-button"
            >
              {isLoading ? "Loading..." : "Login"}
            </button>
          </div>

          {error && (
            <p
              className="text-red-500 text-sm text-center mt-4"
              data-testid="error-message"
            >
              {error}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {!isLoggedIn ? (
          <LoginForm />
        ) : (
          <div className="max-w-2xl mx-auto">
            {formData && (
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">
                  {formData.formTitle}
                </h1>
                <div className="bg-gray-200 h-2 rounded-full mb-4">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        ((currentSection + 1) / formData.sections.length) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <p className="text-gray-600">
                  Section {currentSection + 1} of {formData.sections.length}
                </p>
              </div>
            )}

            {formData &&
              formData.sections[currentSection] &&
              renderSection(formData.sections[currentSection], currentSection)}
          </div>
        )}
      </div>
    </div>
  );
}
