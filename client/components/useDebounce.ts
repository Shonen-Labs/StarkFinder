import { useState, useEffect } from "react";

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		// Set a timer to update the debounced value after the specified delay
		const timer = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		// Clear the timer if the value changes before the delay has passed
		return () => {
			clearTimeout(timer);
		};
	}, [value, delay]);

	return debouncedValue;
}

export default useDebounce;
