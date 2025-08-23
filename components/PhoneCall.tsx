import React, { useEffect, useState, useRef } from 'react';
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteTrack,
  LocalParticipant,
  Track,
  createLocalAudioTrack
} from 'livekit-client';
import Button from './Button';
import { HeadsetIcon } from './icons/HeadsetIcon';

interface CallProps {
  roomName: string;
  token: string;
  onCallEnd: () => void;
}

const PhoneCall: React.FC<CallProps> = ({ roomName, token, onCallEnd }) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const roomRef = useRef<Room | null>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    const connectToRoom = async () => {
      try {
        setIsConnecting(true);
        setError(null);
        
        // Create LiveKit room
        const Room = (await import('livekit-client')).Room;
        const room = new Room({
          // Use correct options based on LiveKit client API
          dynacast: true,
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
          }
        });
        
        roomRef.current = room;
        
        // Set up event listeners
        room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
        room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        
        // Connect to the room
        await room.connect(`https://livekit-server.example.com`, token);
        setIsConnected(true);
        
        // Publish local audio
        await publishLocalAudio(room);
        
      } catch (err) {
        console.error('Error connecting to LiveKit room:', err);
        setError(`Failed to connect to call: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsConnecting(false);
      }
    };
    
    connectToRoom();
    
    // Clean up on unmount
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, [token]);
  
  const publishLocalAudio = async (room: Room) => {
    try {
      // Get microphone permission and publish audio
      const microphoneTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true
      });
      const localTracks = await room.localParticipant.publishTrack(microphoneTrack);
      
      // Set local audio output to the audio element (for monitoring)
      if (localAudioRef.current && microphoneTrack.mediaStream) {
        localAudioRef.current.srcObject = microphoneTrack.mediaStream;
      }
    } catch (err) {
      console.error('Error publishing local audio:', err);
      setError(`Failed to access microphone: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };
  
  const handleParticipantConnected = (participant: RemoteParticipant) => {
    console.log('Participant connected:', participant.identity);
    setIsRemoteConnected(true);
  };
  
  const handleParticipantDisconnected = (participant: RemoteParticipant) => {
    console.log('Participant disconnected:', participant.identity);
    setIsRemoteConnected(false);
  };
  
  const handleTrackSubscribed = (
    track: RemoteTrack,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
      // Set remote audio track to audio element
      remoteAudioRef.current.srcObject = new MediaStream([track.mediaStreamTrack]);
    }
  };
  
  const handleToggleMute = async () => {
    if (!roomRef.current) return;
    
    const localParticipant = roomRef.current.localParticipant;
    
    // Toggle mute status for all audio tracks
    for (const publication of localParticipant.audioTracks.values()) {
      const track = publication.track;
      if (track) {
        if (isMuted) {
          await track.unmute();
        } else {
          await track.mute();
        }
      }
    }
    
    setIsMuted(!isMuted);
  };
  
  const handleEndCall = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
    }
    onCallEnd();
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
        <HeadsetIcon className="h-6 w-6 mr-2 text-primary" />
        Anruf mit KI-Assistent
      </h3>
      
      {error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
          {error}
        </div>
      ) : isConnecting ? (
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Verbinde mit dem KI-Assistenten...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gray-100 p-4 rounded-md text-center">
            {isRemoteConnected ? (
              <p className="text-green-600 font-medium">Verbunden mit KI-Assistent</p>
            ) : (
              <p className="text-gray-600">Warte auf KI-Assistent...</p>
            )}
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleToggleMute}
              variant={isMuted ? "secondary" : "primary"}
            >
              {isMuted ? 'Mikrofon aktivieren' : 'Mikrofon deaktivieren'}
            </Button>
            
            <Button
              onClick={handleEndCall}
              variant="danger"
            >
              Anruf beenden
            </Button>
          </div>
        </div>
      )}
      
      {/* Audio elements (hidden) */}
      <audio ref={localAudioRef} autoPlay muted className="hidden" />
      <audio ref={remoteAudioRef} autoPlay className="hidden" />
    </div>
  );
};

export default PhoneCall;
