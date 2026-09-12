"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { animated, useSpring } from "@react-spring/web";
import { Check, Crop, Loader2, X, ZoomIn, ZoomOut } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface ImageCropperProps {
  imageFile: File | null;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

interface CropperBodyProps {
  imageFile: File;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

const CropperBody = ({ imageFile, onClose, onCropComplete }: CropperBodyProps) => {
  const [zoom, setZoom] = useState([1]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });

  // Add spring animation for smooth zoom
  const [{ zoomSpring }, setZoomSpring] = useSpring(() => ({
    zoomSpring: 1,
    config: { mass: 1, tension: 280, friction: 60 },
  }));

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate object URL for imageFile
  const imageUrl = React.useMemo(() => {
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const calculateBoundaries = useCallback(
    (newX: number, newY: number, scale: number) => {
      if (!containerRef.current || !imageRef.current) return { x: newX, y: newY };

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Calculate the scaled dimensions of the image
      const scaledWidth = naturalDimensions.width * scale;
      const scaledHeight = naturalDimensions.height * scale;

      // Calculate the maximum allowed position based on the scaled dimensions
      const maxX = Math.max((scaledWidth - containerWidth) / 2, 0);
      const maxY = Math.max((scaledHeight - containerHeight) / 2, 0);

      // Bound the position within the allowed range
      return {
        x: Math.max(Math.min(newX, maxX), -maxX),
        y: Math.max(Math.min(newY, maxY), -maxY),
      };
    },
    [naturalDimensions]
  );

  // Handle zoom changes
  const handleZoomChange = useCallback(
    (newZoom: number[]) => {
      const zoomValue = newZoom[0];
      setZoom(newZoom);
      setZoomSpring({ zoomSpring: zoomValue });

      // Recalculate position boundaries with new zoom level
      const boundedPosition = calculateBoundaries(position.x, position.y, zoomValue);
      setPosition(boundedPosition);
    },
    [position.x, position.y, calculateBoundaries, setZoomSpring]
  );

  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const container = containerRef.current;

    const imgDimensions = {
      width: img.naturalWidth,
      height: img.naturalHeight,
    };

    setNaturalDimensions(imgDimensions);

    // Calculate initial zoom to fit the image within the container
    const containerSize = container.offsetWidth;
    const widthRatio = containerSize / imgDimensions.width;
    const heightRatio = containerSize / imgDimensions.height;
    const initialZoom = Math.min(widthRatio, heightRatio);

    // Set initial zoom to fit the image
    setZoom([initialZoom]);
    setZoomSpring({ zoomSpring: initialZoom });
    setImageLoaded(true);
  }, [setZoomSpring]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageLoaded) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !imageLoaded) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      const boundedPosition = calculateBoundaries(newX, newY, zoom[0]);
      setPosition(boundedPosition);
    },
    [isDragging, imageLoaded, dragStart, zoom, calculateBoundaries]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleComplete = async () => {
    if (!imageRef.current || !containerRef.current) return;

    setProcessing(true);

    try {
      const canvas = document.createElement("canvas");
      const containerRect = containerRef.current.getBoundingClientRect();
      const scale = zoom[0];

      // Make canvas same size as the circle crop area
      const cropSize = containerRect.width;
      canvas.width = cropSize;
      canvas.height = cropSize;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Clear canvas with transparent background
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create circular clipping path
      ctx.save();
      ctx.beginPath();
      ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // Calculate center position for image
      const img = imageRef.current;
      const imgWidth = naturalDimensions.width;
      const imgHeight = naturalDimensions.height;

      // Calculate image drawing position
      const scaledImgWidth = imgWidth * scale;
      const scaledImgHeight = imgHeight * scale;

      // Calculate the centered position of the image
      const centerX = (cropSize - scaledImgWidth) / 2 + position.x;
      const centerY = (cropSize - scaledImgHeight) / 2 + position.y;

      // Draw image at correct position with scaling
      ctx.drawImage(
        img,
        0,
        0,
        imgWidth,
        imgHeight,
        centerX,
        centerY,
        scaledImgWidth,
        scaledImgHeight
      );

      // Fill outside circle with white for proper cropping
      ctx.restore();

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) throw new Error("Could not create blob from canvas");
          onCropComplete(blob);
          setProcessing(false);
          onClose();
        },
        "image/jpeg",
        0.95
      );
    } catch (error) {
      console.error("Error cropping image:", error);
      setProcessing(false);
    }
  };

  // Handle touch events for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!imageLoaded) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - position.x,
      y: e.touches[0].clientY - position.y,
    });
  };

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || !imageLoaded) return;

      const newX = e.touches[0].clientX - dragStart.x;
      const newY = e.touches[0].clientY - dragStart.y;

      const boundedPosition = calculateBoundaries(newX, newY, zoom[0]);
      setPosition(boundedPosition);
    },
    [isDragging, imageLoaded, dragStart, zoom, calculateBoundaries]
  );

  return (
    <>
      <div className="flex flex-col items-center my-4">
        {/* Image cropping area */}
        <div
          ref={containerRef}
          className="relative w-64 h-64 overflow-hidden rounded-full border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/10 mb-6 bg-[#131726]/80"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#131726]/80">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
          )}
          {imageUrl && (
            <div
              className="absolute top-1/2 left-1/2"
              style={{
                transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
              }}
            >
              <animated.img
                ref={imageRef}
                src={imageUrl}
                alt="Crop preview"
                onLoad={handleImageLoad}
                style={{
                  transform: zoomSpring.to((s) => `scale(${s})`),
                  transformOrigin: "center",
                  maxWidth: "none",
                  width: "auto",
                  height: "auto",
                }}
                draggable={false}
              />
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="w-full flex items-center gap-4 px-2 py-2 rounded-xl bg-[#131726]/60 border border-white/[0.06]">
          <ZoomOut
            className="h-4 w-4 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            onClick={() => handleZoomChange([Math.max(0.1, zoom[0] - 0.1)])}
          />
          <Slider
            value={zoom}
            min={0.1}
            max={3}
            step={0.05}
            onValueChange={handleZoomChange}
            className="flex-1"
          />
          <ZoomIn
            className="h-4 w-4 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
            onClick={() => handleZoomChange([Math.min(3, zoom[0] + 0.1)])}
          />
        </div>
      </div>

      <DialogFooter className="sm:justify-between gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={processing}
          className="bg-white/[0.05] border-white/[0.08] text-slate-300 hover:bg-white/[0.1] rounded-xl"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!imageLoaded || processing}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30 rounded-xl font-semibold"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Apply Photo
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );
};

const ImageCropper = ({ imageFile, open, onClose, onCropComplete }: ImageCropperProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#0C0E18] border border-white/[0.08] text-slate-100 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg text-slate-100">
            <Crop className="h-5 w-5 mr-2 text-indigo-400" />
            Crop Profile Picture
          </DialogTitle>
        </DialogHeader>

        {imageFile && (
          <CropperBody
            key={`${imageFile.name}-${imageFile.lastModified}`}
            imageFile={imageFile}
            onClose={onClose}
            onCropComplete={onCropComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropper;
