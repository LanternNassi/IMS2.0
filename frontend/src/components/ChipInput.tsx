/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useState } from "react";
import { TextField, Chip, Box, Tooltip, Autocomplete } from "@mui/material";

export interface Tag {
  name: string;
  description?: string;
}

interface ChipInputProps {
  styles?: React.CSSProperties;
  onTagsChange?: (tags: Tag[]) => void;
  searchTags?: (query: string) => Promise<Tag[]>;
  label: string;
  tags?: Tag[];
}

const ChipInput: React.FC<ChipInputProps> = ({ styles, onTagsChange, searchTags, label, tags }) => {
  const [chips, setChips] = useState<Tag[]>(tags?.length ? (tags):([]));
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<Tag[]>([]);

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    if (searchTags) {
      setSuggestions(await searchTags(value));
    }
  };

  const handleAddChip = (value: string) => {
    if (value.trim() !== "") {
      const match = value.match(/^(.*?)\((.*?)\)$/);
      const tag: Tag = match
        ? { name: match[1].trim(), description: match[2].trim() }
        : { name: value.trim() };

      if (!chips.some(chip => chip.name === tag.name)) {
        const newChips = [...chips, tag];
        setChips(newChips);
        onTagsChange && onTagsChange(newChips);
      }
    }
    setInputValue("");
    setSuggestions([]);
  };

  const handleDeleteChip = (chipToDelete: string) => {
    const newChips = chips.filter(chip => chip.name !== chipToDelete);
    setChips(newChips);
    onTagsChange && onTagsChange(newChips);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && inputValue.trim() !== "") {
      handleAddChip(inputValue);
    //   setInputValue("");
      event.preventDefault();
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: 300, ...styles }}>
      <Autocomplete
        freeSolo
        options={suggestions.map((tag) => tag.name)}
        inputValue={inputValue}
        onInputChange={(_, newValue) => setInputValue(newValue)}
        onChange={(_, newValue) => newValue && handleAddChip(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant="outlined"
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
          />
        )}
      />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {chips.map((chip) => (
          <Tooltip key={chip.name} title={chip.description || ""}>
            <Chip label={chip.name} onDelete={() => handleDeleteChip(chip.name)} />
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};

export default ChipInput;
