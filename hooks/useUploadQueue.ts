"use client";
import { useState, useEffect, useCallback } from "react";
import {
  OfflineImage,
  getOfflineImages,
  saveOfflineImage,
  updateOfflineImage,
  deleteOfflineImage,
} from "@/lib/offline-storage";

export function useUploadQueue() {
  const [queue, setQueue] = useState<OfflineImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load existing queue on mount
  useEffect(() => {
    const loadQueue = async () => {
      const images = await getOfflineImages();
      setQueue(images.sort((a, b) => b.createdAt - a.createdAt));
    };
    loadQueue();
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing || !navigator.onLine) return;

    setIsProcessing(true);
    const pendingImages = queue.filter(
      (img) => img.status === "pending" || img.status === "failed",
    );

    for (const image of pendingImages) {
      if (!navigator.onLine) break;

      try {
        // Mark as uploading
        const uploadingImage = { ...image, status: "uploading" as const };
        await updateOfflineImage(uploadingImage);
        setQueue((prev) =>
          prev.map((img) => (img.id === image.id ? uploadingImage : img)),
        );

        // Get auth params
        const authResponse = await fetch("/api/imagekit-auth");
        if (!authResponse.ok) throw new Error("Auth failed");
        const { signature, token, expire } = await authResponse.json();

        const formData = new FormData();
        formData.append("file", image.blob);
        formData.append("fileName", image.fileName);
        formData.append(
          "publicKey",
          process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
        );
        formData.append("signature", signature);
        formData.append("expire", expire.toString());
        formData.append("token", token);

        const response = await fetch(
          `https://upload.imagekit.io/api/v1/files/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();

        // Mark as completed
        const completedImage = {
          ...image,
          status: "completed" as const,
          url: data.url,
        };
        await updateOfflineImage(completedImage);
        setQueue((prev) =>
          prev.map((img) => (img.id === image.id ? completedImage : img)),
        );
      } catch (error) {
        console.error("Upload error for image", image.id, error);
        const failedImage = { ...image, status: "failed" as const };
        await updateOfflineImage(failedImage);
        setQueue((prev) =>
          prev.map((img) => (img.id === image.id ? failedImage : img)),
        );
      }
    }

    setIsProcessing(false);
  }, [queue, isProcessing]);

  // Listen for online event
  useEffect(() => {
    const handleOnline = () => processQueue();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [processQueue]);

  // Automatically start processing if online and there are pending items
  useEffect(() => {
    if (
      navigator.onLine &&
      queue.some((img) => img.status === "pending" || img.status === "failed")
    ) {
      processQueue();
    }
  }, [queue, processQueue]);

  const addToQueue = async (file: File) => {
    const id = crypto.randomUUID();
    const newImage: OfflineImage = {
      id,
      blob: file,
      fileName: `item-${Date.now()}`,
      status: "pending",
      createdAt: Date.now(),
    };

    await saveOfflineImage(newImage);
    setQueue((prev) => [newImage, ...prev]);
    return id;
  };

  const removeFromQueue = async (id: string) => {
    await deleteOfflineImage(id);
    setQueue((prev) => prev.filter((img) => img.id !== id));
  };

  return {
    queue,
    isProcessing,
    addToQueue,
    removeFromQueue,
    processQueue,
  };
}
