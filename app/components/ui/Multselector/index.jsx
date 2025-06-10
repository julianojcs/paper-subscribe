import { useEffect, useState } from 'react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import styles from './Multselector.module.css';

const animatedComponents = makeAnimated();

const customStyles = {
  option: (provided, state) => ({
    ...provided,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    position: 'relative',
    backgroundColor: state.isFocused ? '#f0f0f0' : provided.backgroundColor,
    cursor: 'pointer',
  }),
  control: (provided) => ({
    ...provided,
    minHeight: '38px'
  })
};

const orderOptions = (values) => {
  return values
    .filter((v) => v.isFixed)
    .concat(values.filter((v) => !v.isFixed));
};

const formatOptionLabel = ({ label }) => (
  <div
    className={styles.optionLabel}
    title={label}
  >
    {label}
  </div>
);

const Multselector = ({
  options = [],
  value = [],
  defaultValue = [],
  onChange,
  placeholder = "Selecione itens, ou digite para buscar ou criar...",
  isCreatable = false,
  instanceId,
  onCreateOption,
  CreateLabelText = 'novo item',
  closeMenuOnSelect = true
}) => {
  const [mounted, setMounted] = useState(false);
  const [fixedOptions, setFixedOptions] = useState([]);
  const [selectedOptions, setSelectedOptions] = useState(value || defaultValue);
  const SelectComponent = isCreatable ? CreatableSelect : Select;

  const handleCreate = (inputValue) => {
    // Create a temporary option with a temporary negative ID
    const tempId = -Date.now(); // Use negative timestamp as temporary ID
    const newOption = {
      value: tempId,
      label: inputValue,
      isFixed: false,
      isNew: true,
      tempValue: inputValue // Store original value for later database insertion
    };

    setFixedOptions((prev) => [...prev, newOption]);
    // Update selected options with the new one
    const updatedSelection = [...selectedOptions, newOption];
    setSelectedOptions(updatedSelection);
    // Call parent's onChange with the complete array
    onChange(updatedSelection);

    if (onCreateOption) {
      onCreateOption(newOption);
    }
  };

  // Handle normal selection changes
  const handleChange = (newValue) => {
    setSelectedOptions(newValue);
    onChange(newValue);
  };

  useEffect(() => {
    setFixedOptions(orderOptions(options));
  }, [options]);

  useEffect(() => {
    setSelectedOptions(value);
  }, [value]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Don't render anything on the server side
  }

  return (
    <SelectComponent
      key={instanceId}
      instanceId={instanceId}
      closeMenuOnSelect={closeMenuOnSelect}
      components={{
        ...animatedComponents,
        IndicatorSeparator: () => null // Remove separator to avoid hydration issues
      }}
      value={selectedOptions}
      defaultValue={defaultValue}
      options={fixedOptions}
      onChange={handleChange}
      onCreateOption={handleCreate}
      placeholder={placeholder}
      styles={customStyles}
      formatOptionLabel={formatOptionLabel}
      isClearable
      isCreatable={isCreatable}
      isMulti
      formatCreateLabel={(inputValue) => `Criar ${CreateLabelText} "${inputValue}"`}
      aria={{
        label: placeholder,
        live: 'polite',
        expanded: false
      }}
    />
  );
};

export default Multselector;