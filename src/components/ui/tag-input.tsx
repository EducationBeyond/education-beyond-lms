'use client';

import { useState, useRef, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
  disabled?: boolean;
  suggestions?: string[];
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'タグを追加...',
  maxTags,
  className,
  disabled = false,
  suggestions = [],
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      !value.includes(suggestion) &&
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (
      trimmedTag &&
      !value.includes(trimmedTag) &&
      (!maxTags || value.length < maxTags)
    ) {
      onChange([...value, trimmedTag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex min-h-[40px] w-full flex-wrap items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 text-xs"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        {(!maxTags || value.length < maxTags) && !disabled && (
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(e.target.value.length > 0 && suggestions.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(inputValue.length > 0 && suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={value.length === 0 ? placeholder : ''}
            className="min-w-[120px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
          />
        )}

        {maxTags && (
          <span className="text-xs text-muted-foreground">
            {value.length}/{maxTags}
          </span>
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
          {filteredSuggestions.slice(0, 5).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-3 w-3" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface CheckboxTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
  allowCustomTags?: boolean;
  placeholder?: string;
  maxTags?: number;
}

export function CheckboxTagInput({
  value = [],
  onChange,
  options,
  className,
  disabled = false,
  allowCustomTags = false,
  placeholder = 'カスタムタグを追加...',
  maxTags,
}: CheckboxTagInputProps) {
  const handleCheckboxChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      if (!maxTags || value.length < maxTags) {
        onChange([...value, optionValue]);
      }
    } else {
      onChange(value.filter((tag) => tag !== optionValue));
    }
  };

  const handleCustomTagsChange = (customTags: string[]) => {
    const predefinedTags = value.filter((tag) =>
      options.some((option) => option.value === tag)
    );
    onChange([...predefinedTags, ...customTags]);
  };

  const customTags = value.filter(
    (tag) => !options.some((option) => option.value === tag)
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Predefined Options */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex items-center space-x-2',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <input
              type="checkbox"
              checked={value.includes(option.value)}
              onChange={(e) =>
                handleCheckboxChange(option.value, e.target.checked)
              }
              disabled={Boolean(
                disabled ||
                (maxTags && !value.includes(option.value) && value.length >= maxTags)
              )}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{option.label}</span>
          </label>
        ))}
      </div>

      {/* Custom Tags Input */}
      {allowCustomTags && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            カスタムタグ（任意）
          </label>
          <TagInput
            value={customTags}
            onChange={handleCustomTagsChange}
            placeholder={placeholder}
            maxTags={maxTags ? maxTags - (value.length - customTags.length) : undefined}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}