
"use client";

import { useState, useRef } from "react";
import { Mic, Square, Play, Trash2 } from "lucide-react";

interface AudioRecorderProps {
    onAudioCaptured: (blob: Blob) => void;
    onClear: () => void;
}

export function AudioRecorder({ onAudioCaptured, onClear }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" }); // WebM is widely supported
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);
                onAudioCaptured(blob);
                stream.getTracks().forEach(track => track.stop()); // Stop mic usage
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please ensure permissions are granted.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleClear = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        onClear();
    };

    return (
        <div className="flex flex-col gap-4 items-center bg-white/5 p-6 rounded-xl border border-white/10">
            {!audioBlob ? (
                <div className="text-center">
                    <p className="text-white/60 text-sm mb-4">Record your melody or beat (max 1 min)</p>
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording
                                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                                : "bg-primary hover:scale-105"
                            }`}
                    >
                        {isRecording ? <Square fill="white" className="w-6 h-6" /> : <Mic className="w-8 h-8" />}
                    </button>
                    <p className="mt-2 text-xs uppercase font-bold tracking-wider text-white/40">
                        {isRecording ? "Recording..." : "Tap to Record"}
                    </p>
                </div>
            ) : (
                <div className="w-full">
                    <div className="mb-4">
                        <audio controls src={audioUrl!} className="w-full h-10" />
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={handleClear}
                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                            <Trash2 className="w-3 h-3" /> Record Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
