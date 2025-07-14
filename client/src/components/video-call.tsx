import React, { useRef, useEffect } from "react";

interface VideoCallProps {
  roomId: string;
  userRole: "doctor" | "patient";
}

// Simple PeerJS video call (browser-to-browser)
const VideoCall: React.FC<VideoCallProps> = ({ roomId, userRole }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically import PeerJS
    import("peerjs").then(({ default: Peer }) => {
      const peer = new Peer(roomId + "-" + userRole, {
        host: "peerjs.com",
        port: 443,
        secure: true,
      });
      peerRef.current = peer;

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          peer.on("call", (call: any) => {
            call.answer(stream);
            call.on("stream", (remoteStream: MediaStream) => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
            });
          });
          if (userRole === "doctor") {
            // Wait for patient to join
          } else {
            // Patient initiates call
            const doctorPeerId = roomId + "-doctor";
            const call = peer.call(doctorPeerId, stream);
            call.on("stream", (remoteStream: MediaStream) => {
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
            });
          }
        });
    });
    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [roomId, userRole]);

  return (
    <div className="flex flex-col items-center gap-4">
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className="rounded-lg border w-64 h-48"
      />
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className="rounded-lg border w-64 h-48"
      />
      <div className="text-center text-gray-600 mt-2">
        {userRole === "doctor"
          ? "Waiting for patient to join..."
          : "Connecting to doctor..."}
      </div>
    </div>
  );
};

export default VideoCall;
