"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const FolderNode = ({ node, selectedFolderId, onSelect, onCreateFolder, onDeleteFolder, depth = 0 }) => {
    const [isOpen, setIsOpen] = useState(true);
    const isSelected = selectedFolderId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const isRoot = node.id === "root";

    const handleToggle = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const handleSelect = () => {
        onSelect(node.id);
    };

    const handleAddChild = (e) => {
        e.stopPropagation();
        onCreateFolder(node.id);
        setIsOpen(true); // Open folder when adding child
    };

    const handleDelete = (e) => {
        e.stopPropagation();
        onDeleteFolder(node.id);
    };

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-accent/50 group transition-colors",
                    isSelected && "bg-accent text-accent-foreground"
                )}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={handleSelect}
            >
                <div
                    className="mr-1 p-0.5 rounded-sm hover:bg-muted-foreground/20 text-muted-foreground"
                    onClick={hasChildren ? handleToggle : undefined}
                >
                    {hasChildren ? (
                        isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )
                    ) : (
                        <div className="w-4 h-4" />
                    )}
                </div>

                {isOpen ? (
                    <FolderOpen className={cn("h-4 w-4 mr-2 text-blue-500", isSelected && "text-blue-600")} />
                ) : (
                    <Folder className={cn("h-4 w-4 mr-2 text-blue-500", isSelected && "text-blue-600")} />
                )}

                <span className="truncate flex-1 text-sm font-medium">{node.name}</span>

                <div className="ml-auto flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isRoot && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={handleDelete}
                            title="Delete folder"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground"
                        onClick={handleAddChild}
                        title="Add subfolder"
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {isOpen && hasChildren && (
                <div>
                    {node.children.map((child) => (
                        <FolderNode
                            key={child.id}
                            node={child}
                            selectedFolderId={selectedFolderId}
                            onSelect={onSelect}
                            onCreateFolder={onCreateFolder}
                            onDeleteFolder={onDeleteFolder}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export function FolderTree({ nodes, selectedFolderId, onSelect, onCreateFolder, onDeleteFolder }) {
    return (
        <div className="flex flex-col gap-0.5">
            {nodes.map((node) => (
                <FolderNode
                    key={node.id}
                    node={node}
                    selectedFolderId={selectedFolderId}
                    onSelect={onSelect}
                    onCreateFolder={onCreateFolder}
                    onDeleteFolder={onDeleteFolder}
                />
            ))}
        </div>
    );
}
