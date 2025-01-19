import "../styles/dropdown.css";
import React, { useState, useEffect, useRef } from "react";

const Dropdown = ({ label, options, value, onChange, exclude }) => {
    const [searchValue, setSearchValue] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const filteredOptions = options
        .filter((option) => option !== exclude)
        .sort((a, b) => {
            const startsWithA = a.toLowerCase().startsWith(searchValue.toLowerCase());
            const startsWithB = b.toLowerCase().startsWith(searchValue.toLowerCase());
            if (startsWithA && !startsWithB) return -1;
            if (!startsWithA && startsWithB) return 1;
            return a.localeCompare(b);
        })
        .filter((option) =>
            option.toLowerCase().includes(searchValue.toLowerCase())
        );

    const handleOptionClick = (option) => {
        onChange(option);
        setIsOpen(false);
        setSearchValue("");
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="dropdown" ref={dropdownRef}>
            <label>{label}</label>
            <input
                className="dropdown-input"
                type="text"
                placeholder={`Select an option`}
                value={isOpen ? searchValue : value}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => setSearchValue(e.target.value)}
                readOnly={!isOpen}
            />
            {isOpen && (
                <ul className="dropdown-options">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <li
                                key={option}
                                className="dropdown-option"
                                onClick={() => handleOptionClick(option)}
                            >
                                {option}
                            </li>
                        ))
                    ) : (
                        <li className="dropdown-no-options">No options found</li>
                    )}
                </ul>
            )}
        </div>
    );
};

export default Dropdown;
