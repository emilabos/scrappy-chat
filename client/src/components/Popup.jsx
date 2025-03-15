import React, { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import Cookies from "js-cookie";

const AdPopup = ({ isShowing, handleClose }) => {
  const [currentAd, setCurrentAd] = useState(null);
  const [availableAds, setAvailableAds] = useState([]);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(null);
  const playerRef = useRef(null);

  const assetsDir = "/assets";

  const onClose = () => {
    if (videoCompleted) {
      Cookies.remove("showAd");
      handleClose();
      setVideoCompleted(false);
      setCurrentTime(0);
    }
  };

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const adsResponse = await fetch(assetsDir + "/ads.json");
        setAvailableAds(await adsResponse.json());
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load ad data.");
      }
    };

    fetchAds();
  }, []);

  useEffect(() => {
    if (availableAds.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableAds.length);
      setCurrentAd(availableAds[randomIndex]);
      setVideoCompleted(false);
      setCurrentTime(0);
    }
  }, [availableAds, isShowing]);

  const handleDuration = (duration) => {
    setVideoDuration(duration);
  };

  const handleProgress = (state) => {
    setCurrentTime(state.playedSeconds);

    if (state.playedSeconds >= videoDuration - 0.5) {
      setVideoCompleted(true);
    }
  };

  const handleSeek = (seconds) => {
    if (seconds > currentTime + 1 && !videoCompleted) {
      playerRef.current.seekTo(currentTime);
    }
  };

  if (!isShowing) return <></>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-isabelline rounded-lg shadow-2xl p-6 w-1/2 transform transition-all duration-300 ease-in-out ${
          isShowing ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h2 className="text-2xl font-bold text-raisin-black mb-6 text-center">
          Watch this ad to continue
        </h2>

        <div className="mb-6 flex justify-center align-middle">
          <div className="rounded-lg">
            <ReactPlayer
              ref={playerRef}
              muted={true}
              controls={false}
              playing={true}
              url={currentAd}
              onDuration={handleDuration}
              onProgress={handleProgress}
              onSeek={handleSeek}
              onEnded={() => setVideoCompleted(true)}
              config={{
                file: {
                  attributes: {
                    controlsList: "nodownload",
                    disablePictureInPicture: true,
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="mb-4 text-center text-sm text-gray-600">
          {videoCompleted
            ? "Thank you for watching! You can now close this ad."
            : "Please watch the entire ad before closing (you don't really have a choice)"}
        </div>

        <button
          onClick={onClose}
          type="submit"
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            videoCompleted
              ? "bg-raisin-black text-bone hover:bg-wenge"
              : "bg-gray-400 text-gray-200 cursor-not-allowed"
          }`}
          disabled={!videoCompleted}
        >
          {videoCompleted
            ? "Close Ad"
            : `Please watch the ad (${Math.round(
                videoDuration - currentTime
              )}s left)`}
        </button>
      </div>
    </div>
  );
};

export default AdPopup;
