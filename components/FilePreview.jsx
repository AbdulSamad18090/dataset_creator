"use client";

import React from "react";
import { useDropzone } from "react-dropzone";
import { X, UploadCloud, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function FilePreview({ files, onDrop, onRemove }) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/*": [],
        },
    });

    return (
        <div className="h-full flex flex-col gap-4 overflow-hidden">
            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={`
          border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors shrink-0
          ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"}
        `}
            >
                <input {...getInputProps()} />
                <div className="bg-background p-3 rounded-full shadow-sm mb-4">
                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                </div>
                {isDragActive ? (
                    <p className="text-primary font-medium">Drop the images here ...</p>
                ) : (
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Drag & drop images here, or click to select files</p>
                        <p className="text-xs text-muted-foreground">Supports JPG, PNG, WEBP</p>
                    </div>
                )}
            </div>

            {/* File Grid */}
            <div className="flex-1 min-h-0 overflow-auto">
                {files.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                        <ImageIcon className="h-10 w-10 mb-2" />
                        <p>No images in this folder yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
                        {files.map((file) => (
                            <Card key={file.id} className="group relative aspect-square overflow-hidden border-0 shadow-sm bg-muted/20">
                                <img
                                    src={file.preview}
                                    alt={file.name}
                                    className="w-full h-full object-cover scale-125 transition-transform group-hover:scale-130"
                                    onLoad={() => {
                                        // Optional: revoke object URL to avoid memory leaks if we were managing it strictly, 
                                        // but for this app keeping it alive is fine for navigation.
                                        // URL.revokeObjectURL(file.preview)
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemove(file.id);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-xs text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                    {file.name}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
