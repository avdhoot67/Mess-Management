import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const PasswordInput = ({ className = '', disabled = false, ...inputProps }) => {
  const [visible, setVisible] = useState(false)
  const label = visible ? 'Hide password' : 'Show password'

  return (
    <div className="relative">
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={`${className} pr-12`}
      />
      <button
        type="button"
        aria-label={label}
        aria-pressed={visible}
        aria-controls={inputProps.id}
        title={label}
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-slate-500 transition hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {visible ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}
      </button>
    </div>
  )
}

export default PasswordInput
