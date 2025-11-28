import React from 'react';

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, checked, onChange, disabled = false }) => {
  const bgColor = checked ? 'bg-cyan-600' : 'bg-gray-600';
  const circleTransform = checked ? 'translate-x-5' : 'translate-x-0';

  return (
    <label className={`flex items-center ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <span className="mr-3 font-semibold text-white select-none">{label}</span>
      <div className="relative">
        <div className={`block w-11 h-6 rounded-full transition-colors ${bgColor}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${circleTransform}`}></div>
        <input
          type="checkbox"
          className="absolute opacity-0 w-full h-full cursor-pointer"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    </label>
  );
};

export default ToggleSwitch;
