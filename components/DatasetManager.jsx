"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FolderTree } from "./FolderTree";
import { FilePreview } from "./FilePreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { v4 as uuidv4 } from "uuid";
import localforage from "localforage";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DatasetManager() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [folders, setFolders] = useState([
        { id: "root", name: "Root", parentId: null, children: [] },
    ]);
    const [selectedFolderId, setSelectedFolderId] = useState("root");
    const [files, setFiles] = useState({});
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [createFolderParentId, setCreateFolderParentId] = useState(null);
    const [folderToDeleteId, setFolderToDeleteId] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load state from storage on mount
    useEffect(() => {
        const loadState = async () => {
            console.log("Starting to load state...");
            try {
                localforage.config({ name: 'dataset_creator' });

                const storedFolders = await localforage.getItem("folders");
                const storedFiles = await localforage.getItem("files");

                console.log("Loaded folders:", storedFolders ? "Found" : "Null");
                console.log("Loaded files:", storedFiles ? "Found" : "Null");

                if (storedFolders) {
                    setFolders(storedFolders);
                }

                if (storedFiles) {
                    const hydratedFiles = {};
                    Object.keys(storedFiles).forEach((folderId) => {
                        hydratedFiles[folderId] = storedFiles[folderId].map((f) => ({
                            ...f,
                            preview: URL.createObjectURL(f.file),
                        }));
                    });
                    setFiles(hydratedFiles);
                }

                const folderIdParam = searchParams.get("folderId");
                if (folderIdParam) {
                    setSelectedFolderId(folderIdParam);
                }
            } catch (error) {
                console.error("Failed to load state from storage:", error);
            } finally {
                console.log("Finished loading state.");
                setIsLoaded(true);
            }
        };

        const timeoutId = setTimeout(() => {
            console.warn("State loading timed out, forcing application load.");
            setIsLoaded(true);
        }, 1000);

        loadState().then(() => clearTimeout(timeoutId));
    }, [searchParams]);

    // Sync URL when selectedFolderId changes
    useEffect(() => {
        if (!isLoaded) return;

        const currentFolderId = searchParams.get("folderId");
        if (currentFolderId !== selectedFolderId) {
            const params = new URLSearchParams(searchParams.toString());
            if (selectedFolderId) {
                params.set("folderId", selectedFolderId);
            } else {
                params.delete("folderId");
            }
            router.replace(`${pathname}?${params.toString()}`);
        }
    }, [selectedFolderId, isLoaded, router, pathname, searchParams]);

    // Save folders to storage when changed
    useEffect(() => {
        if (isLoaded) {
            localforage.setItem("folders", folders).catch(err => console.error("Failed to save folders:", err));
        }
    }, [folders, isLoaded]);

    // Save files to storage when changed
    useEffect(() => {
        if (isLoaded) {
            localforage.setItem("files", files).catch(err => console.error("Failed to save files:", err));
        }
    }, [files, isLoaded]);

    const handleCreateFolder = () => {
        if (!newFolderName.trim()) return;

        const newFolderId = uuidv4();
        const newFolder = {
            id: newFolderId,
            name: newFolderName,
            parentId: createFolderParentId,
            children: [],
        };

        setFolders((prev) => {
            const addFolder = (nodes) => {
                return nodes.map((node) => {
                    if (node.id === createFolderParentId) {
                        return { ...node, children: [...node.children, newFolder] };
                    }
                    if (node.children) {
                        return { ...node, children: addFolder(node.children) };
                    }
                    return node;
                });
            };
            return addFolder(prev);
        });

        setNewFolderName("");
        setIsCreateFolderOpen(false);
    };

    const openCreateFolderModal = (parentId) => {
        setCreateFolderParentId(parentId);
        setNewFolderName("");
        setIsCreateFolderOpen(true);
    };

    const handleDropFiles = useCallback((acceptedFiles) => {
        if (!selectedFolderId) return;

        const newFiles = acceptedFiles.map((file) => ({
            id: uuidv4(),
            file,
            preview: URL.createObjectURL(file),
            name: file.name,
        }));

        setFiles((prev) => ({
            ...prev,
            [selectedFolderId]: [...(prev[selectedFolderId] || []), ...newFiles],
        }));
    }, [selectedFolderId]);

    const handleRemoveFile = (fileId) => {
        setFiles((prev) => ({
            ...prev,
            [selectedFolderId]: prev[selectedFolderId].filter((f) => f.id !== fileId),
        }));
    };

    const handleExportZip = async () => {
        const zip = new JSZip();
        const metadata = { folders: [], files: [] };

        const processFolder = (folder, path) => {
            const folderPath = path ? `${path}/${folder.name}` : folder.name;
            metadata.folders.push({ id: folder.id, name: folder.name, path: folderPath });

            // Always create the folder in the ZIP (this ensures empty folders are included)
            zip.folder(folderPath);

            const folderFiles = files[folder.id] || [];
            folderFiles.forEach((f) => {
                zip.file(`${folderPath}/${f.name}`, f.file);
                metadata.files.push({
                    id: f.id,
                    name: f.name,
                    folderId: folder.id,
                    path: `${folderPath}/${f.name}`,
                });
            });

            folder.children.forEach((child) => processFolder(child, folderPath));
        };

        folders.forEach(folder => processFolder(folder, ""));
        zip.file("dataset_metadata.json", JSON.stringify(metadata, null, 2));

        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "dataset.zip");
    };

    const confirmDeleteFolder = () => {
        if (!folderToDeleteId) return;
        const folderId = folderToDeleteId;

        if (folderId === "root") return;

        const getFolderIdsToRemove = (nodes, targetId) => {
            let ids = [];
            for (const node of nodes) {
                if (node.id === targetId) {
                    const collect = (n) => {
                        ids.push(n.id);
                        if (n.children) n.children.forEach(collect);
                    };
                    collect(node);
                    return ids;
                }
                if (node.children) {
                    const childIds = getFolderIdsToRemove(node.children, targetId);
                    if (childIds.length > 0) return childIds;
                }
            }
            return [];
        };

        const idsToRemove = getFolderIdsToRemove(folders, folderId);

        setFolders((prev) => {
            const removeNode = (nodes) => {
                return nodes
                    .filter((node) => node.id !== folderId)
                    .map((node) => {
                        if (node.children) {
                            return { ...node, children: removeNode(node.children) };
                        }
                        return node;
                    });
            };
            return removeNode(prev);
        });

        setFiles((prev) => {
            const newFiles = { ...prev };
            idsToRemove.forEach((id) => delete newFiles[id]);
            return newFiles;
        });

        if (idsToRemove.includes(selectedFolderId)) {
            setSelectedFolderId("root");
        }
        setFolderToDeleteId(null);
    };

    const handleDeleteFolder = (folderId) => {
        setFolderToDeleteId(folderId);
    };

    const findFolder = (nodes, id) => {
        for (const node of nodes) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findFolder(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const selectedFolder = findFolder(folders, selectedFolderId);

    if (!isLoaded) {
        return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
    }

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 border-r bg-muted/10 flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="font-semibold">Folders</h2>
                </div>
                <div className="flex-1 overflow-auto p-2">
                    <FolderTree
                        nodes={folders}
                        selectedFolderId={selectedFolderId}
                        onSelect={setSelectedFolderId}
                        onCreateFolder={openCreateFolderModal}
                        onDeleteFolder={handleDeleteFolder}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full">
                <div className="h-14 border-b flex items-center justify-between px-4 bg-card">
                    <h1 className="text-lg font-medium">
                        {selectedFolder ? selectedFolder.name : "Select a folder"}
                    </h1>
                    <Button onClick={handleExportZip} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export Dataset
                    </Button>
                </div>
                <div className="flex-1 overflow-hidden p-4 bg-slate-50 dark:bg-slate-900/50">
                    {selectedFolder ? (
                        <FilePreview
                            files={files[selectedFolderId] || []}
                            onDrop={handleDropFiles}
                            onRemove={handleRemoveFile}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Select a folder to view files
                        </div>
                    )}
                </div>
            </div>

            {/* Create Folder Dialog */}
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="col-span-3"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreateFolder();
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateFolder}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!folderToDeleteId} onOpenChange={(open) => !open && setFolderToDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the folder
                            and all files contained within it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteFolder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
