import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, ColDef,  themeQuartz } from 'ag-grid-community'; 
import { useMemo, useEffect, useState, useRef } from 'react';
import { cn } from '../../lib/utils'; // Assuming you have a utils file

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

interface AgGridViewProps {
    data: any[];
    columns: ColDef[]; // Use AgGrid's ColDef
    onRowClick?: (row: any) => void;
    onCellEdit?: (rowIndex: number, columnId: string, value: any) => void;
    onDelete?: (row: any) => void; // Add onDelete prop
    enableSorting?: boolean;
    className?: string; // Allow custom class names
    style?: React.CSSProperties; // Allow custom styles
    theme?: string; // Allow theme override
}

export const AgGridView = ({
    data,
    columns,
    onRowClick,
    onCellEdit,
    onDelete,
    enableSorting = true,
    className,
    style,
    theme = "ag-theme-quartz" // Default theme
}: AgGridViewProps) => {

    const gridRef = useRef<AgGridReact>(null);

    // Default column definitions
    const defaultColDef = useMemo<ColDef>(() => {
        return {
            flex: 1,
            minWidth: 100,
            sortable: enableSorting,
            filter: true, // Enable filtering by default for AgGrid
            resizable: true,
            editable: !!onCellEdit, // Enable editing if handler provided (can be overridden per column)
        };
    }, [enableSorting, onCellEdit]);

    // augment columns with actions if onDelete provided
    const gridColumns = useMemo(() => {
        if (!onDelete) return columns;
        return [
            ...columns,
            {
                headerName: '',
                field: 'actions',
                width: 80,
                minWidth: 80,
                maxWidth: 80,
                sortable: false,
                filter: false,
                editable: false,
                cellRenderer: (params: any) => (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            onDelete(params.data);
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                )
            }
        ];
    }, [columns, onDelete]);


    // Handle cell editing
    const onCellValueChanged = (event: any) => {
        if (onCellEdit && event.data) {
             // AgGrid uses rowNode.rowIndex to identify rows. 
             // Be mindful if you use sorting/filtering in AgGrid, rowIndex refers to the view index.
             // If you need the original data index, you might need to manage IDs.
             // Here we assume data order matches or we pass ID if needed.
             // But simpler: just pass the row data ID if available, or index.
             const rowIndex = event.rowIndex;
             const colId = event.column.getColId();
             const newValue = event.newValue;
             onCellEdit(rowIndex, colId, newValue);
        }
    };

    // Handle row click
    const onRowClicked = (event: any) => {
        if (onRowClick) {
            onRowClick(event.data);
        }
    };


    return (
        <div 
             className={cn( theme, className)} // Apply theme class
             style={{ height: '100%', width: '100%', ...style }} // Ensure container has height
        >
            <AgGridReact
                ref={gridRef}
                rowData={data}
                columnDefs={gridColumns}
                defaultColDef={defaultColDef}
                onCellValueChanged={onCellValueChanged}
                onRowClicked={onRowClicked}
                rowSelection="multiple" // Optional: Enable row selection
                pagination={true} // Optional: Enable pagination
                paginationPageSize={20}
                paginationPageSizeSelector={[20, 50, 100]}
            />
        </div>
    );
};
