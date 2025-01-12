import { Check } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

const HoverableCheckbox = ({ checked, onCheckedChange }) => {
  return (
    <div className="relative group">
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="h-5 w-5 hover:bg-gray-200 dark:hover:bg-zinc-400"
      />
      <Check 
        className="absolute pointer-events-none opacity-0 group-hover:opacity-20 top-0.5 left-0.5 h-4 w-4" 
        aria-hidden="true"
      />
    </div>
  )
}

export default HoverableCheckbox