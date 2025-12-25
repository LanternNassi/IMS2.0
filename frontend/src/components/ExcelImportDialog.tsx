"use client"

import type React from "react"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, FileUp, Loader2 } from "lucide-react"

export interface ColumnMapping {
    field: string
    possibleNames: string[]
    transform?: (value: any) => any
    required?: boolean
}

export interface ExcelImportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    description?: string
    columnMappings: ColumnMapping[]
    onImport: (data: any[]) => void | Promise<void>
    renderPreviewRow?: (row: any, index: number) => React.ReactNode
    importButtonText?: string
    cancelButtonText?: string
    acceptedFileTypes?: string
}

export function ExcelImportDialog({
    open,
    onOpenChange,
    title = "Import from Excel",
    description = "Select an Excel file to import data into the system",
    columnMappings,
    onImport,
    renderPreviewRow,
    importButtonText = "Import",
    cancelButtonText = "Cancel",
    acceptedFileTypes = ".xlsx,.xls",
}: ExcelImportDialogProps) {
    const [importedData, setImportedData] = useState<any[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fileName, setFileName] = useState<string | null>(null)

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsProcessing(true)
        setError(null)
        setImportedData([])
        setFileName(file.name)

        try {
            const ExcelJS = (await import("exceljs")).default
            const workbook = new ExcelJS.Workbook()
            const buffer = await file.arrayBuffer()
            await workbook.xlsx.load(buffer)

            const worksheet = workbook.worksheets[0]
            const rows: any[] = []

            const headerRow = worksheet.getRow(1)
            const headers: { [key: string]: number } = {}

            headerRow.eachCell((cell, colNumber) => {
                const headerValue = cell.value?.toString().toLowerCase().trim() || ""
                headers[headerValue] = colNumber
            })

            const getColumnIndex = (possibleNames: string[]) => {
                for (const name of possibleNames) {
                    if (headers[name]) return headers[name]
                }
                return null
            }

            const columnIndices: { [field: string]: number | null } = {}
            columnMappings.forEach((mapping) => {
                columnIndices[mapping.field] = getColumnIndex(mapping.possibleNames)

                if (mapping.required && !columnIndices[mapping.field]) {
                    throw new Error(`Required column "${mapping.possibleNames[0]}" not found in Excel file`)
                }
            })

            for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
                const row = worksheet.getRow(rowNumber)

                const firstRequiredField = columnMappings.find((m) => m.required)?.field || columnMappings[0]?.field
                if (!firstRequiredField || !row.getCell(columnIndices[firstRequiredField] || 1).value) {
                    continue
                }

                const rowData: any = {}
                let hasData = false

                columnMappings.forEach((mapping) => {
                    const colIndex = columnIndices[mapping.field]
                    if (colIndex) {
                        const cell = row.getCell(colIndex)
                        const cellValue = cell.value

                        // Handle different cell value types
                        let value: any = ""
                        if (cellValue === null || cellValue === undefined) {
                            value = ""
                        } else if (typeof cellValue === "object" && cellValue !== null) {
                            // Handle formula objects (formula with result)
                            if ("result" in cellValue && cellValue.result !== null && cellValue.result !== undefined) {
                                // Formula object: use the calculated result
                                value = String(cellValue.result)
                            } else if ("richText" in cellValue && Array.isArray((cellValue as any).richText)) {
                                // Rich text: extract text from rich text array
                                value = (cellValue as any).richText.map((rt: any) => rt.text || "").join("")
                            } else if ("text" in cellValue && typeof (cellValue as any).text === "string") {
                                // Object with text property
                                value = (cellValue as any).text
                            } else if (Array.isArray(cellValue)) {
                                // Array: join elements
                                value = cellValue.map((item: any) => 
                                    typeof item === "object" && item !== null && "text" in item ? item.text : String(item)
                                ).join("")
                            } else {
                                // Try to get text representation
                                value = String(cellValue)
                            }
                        } else {
                            // Primitive value: convert to string
                            value = String(cellValue)
                        }
                        
                        // Trim whitespace
                        value = value.trim()

                        if (mapping.transform) {
                            value = mapping.transform(value)
                        }

                        rowData[mapping.field] = value
                        if (value) hasData = true
                    } else if (mapping.required) {
                        rowData[mapping.field] = ""
                    }
                })

                if (hasData) {
                    rows.push(rowData)
                }
            }

            if (rows.length === 0) {
                throw new Error("No data found in Excel file. Please check the file format.")
            }

            setImportedData(rows)
        } catch (error) {
            console.error("Error reading Excel file:", error)
            const errorMessage = error instanceof Error ? error.message : "Failed to read Excel file"
            setError(errorMessage)
            setImportedData([])
        } finally {
            setIsProcessing(false)
        }
    }

    const handleImport = async () => {
        if (importedData.length === 0) return

        setIsImporting(true)
        try {
            await onImport(importedData)
            setImportedData([])
            setFileName(null)
            onOpenChange(false)
        } catch (error) {
            console.error("Error importing data:", error)
            setError(error instanceof Error ? error.message : "Failed to import data")
        } finally {
            setIsImporting(false)
        }
    }

    const handleCancel = () => {
        setImportedData([])
        setError(null)
        setFileName(null)
        onOpenChange(false)
    }

    const defaultRenderRow = (row: any, index: number) => {
        return (
            <tr key={index} className="border-b border-border hover:bg-accent/50 transition-colors">
                {columnMappings.map((mapping) => (
                    <td key={mapping.field} className="px-4 py-3 text-sm text-foreground font-mono">
                        {typeof row[mapping.field] === "number"
                            ? row[mapping.field].toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            })
                            : String(row[mapping.field] || "")}
                    </td>
                ))}
            </tr>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] dark:bg-gray-900 dark:text-white flex flex-col overflow-hidden">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="text-2xl">{title}</DialogTitle>
                    <DialogDescription className="text-base">{description}</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4 flex-1 min-h-0 overflow-y-auto">
                    <div className="space-y-3">
                        <label htmlFor="file-input" className="block text-sm font-medium text-foreground">
                            Select Excel File
                        </label>
                        <label
                            htmlFor="file-input"
                            className="relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                        >
                            <div className="flex flex-col items-center justify-center">
                                <FileUp className="h-8 w-8 text-muted-foreground mb-2" />
                                <span className="text-sm font-medium text-foreground">
                                    {fileName ? fileName : "Click to upload or drag and drop"}
                                </span>
                                <span className="text-xs text-muted-foreground mt-1">
                                    {acceptedFileTypes.replace(/\./g, "").toUpperCase()} files only
                                </span>
                            </div>
                            <input
                                id="file-input"
                                type="file"
                                accept={acceptedFileTypes}
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={isProcessing}
                            />
                        </label>
                    </div>

                    {isProcessing && (
                        <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin flex-shrink-0" />
                            <span className="text-sm text-foreground">Processing Excel file...</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-destructive">Import Error</p>
                                <p className="text-sm text-destructive/90 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {importedData.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                                <span className="text-sm font-medium text-foreground">
                                    Successfully parsed {importedData.length} {importedData.length === 1 ? "item" : "items"}
                                </span>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium text-foreground">Preview</p>
                                <div className="border border-border rounded-lg overflow-hidden">
                                    <div className="max-h-80 overflow-auto">
                                        <table className="w-full text-sm min-w-max">
                                            <thead className="sticky top-0 bg-muted dark:bg-gray-800 z-10">
                                                <tr className="border-b border-border">
                                                    {columnMappings.map((mapping) => (
                                                        <th
                                                            key={mapping.field}
                                                            className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap bg-muted dark:bg-gray-800"
                                                        >
                                                            {mapping.possibleNames[0].charAt(0).toUpperCase() +
                                                                mapping.possibleNames[0].slice(1).replace(/([A-Z])/g, " $1")}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border bg-background dark:bg-gray-900">
                                                {importedData
                                                    .slice(0, 10)
                                                    .map((row, index) =>
                                                        renderPreviewRow ? renderPreviewRow(row, index) : defaultRenderRow(row, index),
                                                    )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {importedData.length > 10 && (
                                    <p className="text-xs text-muted-foreground">Showing 10 of {importedData.length} items</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-3 pt-6 border-t border-border flex-shrink-0">
                    <Button variant="outline" onClick={handleCancel} disabled={isImporting} className="dark:bg-gray-700 dark:text-white">
                        {cancelButtonText}
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={importedData.length === 0 || isProcessing || isImporting}
                        className="gap-2 dark:bg-gray-700 dark:text-white"
                    >
                        {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {importButtonText}
                        {importedData.length > 0 && <span className="text-xs opacity-75">({importedData.length})</span>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}