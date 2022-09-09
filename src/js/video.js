import "./vendors/iframe_api";

class Video {
    constructor({ containerId, videoId }) {
        this.videoFrame = new YT.Player(containerId, {
            height: '120%',
            width: '100%',
            videoId: videoId,
            playerVars: {
                'controls': 0, 'disablekb': 1, 'modestbranding': 1, 'rel': 0, 'showinfo': 0 },
            events: {
                'onReady': this.onPlayerReady.bind(this),
            }
        });
        this.videoFrameContainer = document.getElementById(containerId).closest('.video-container');
    }

    onPlayerReady() {
        this.videoFrameContainer.addEventListener('click', this.managePlayer.bind(this));
    }

    play() {
        this.videoFrame.playVideo();
        this.videoFrameContainer.classList.remove('paused');
        this.videoFrameContainer.classList.add('playing');
    }

    pause() {
        this.videoFrame.pauseVideo();
        this.videoFrameContainer.classList.remove('playing');
        this.videoFrameContainer.classList.add('paused');
    }

    managePlayer() {
        switch (this.videoFrame.getPlayerState()) {
            case 5:
            case 2:
            case -1:
                this.play.apply(this);
                break;

            case 1:
                this.pause.apply(this);
                break;
        }
    }
}
export function createPlayer(...players) {
    window.onYouTubeIframeAPIReady = () => {
        [...players].forEach((player) => new Video({ containerId: player.containerId, videoId: player.videoId }));
    };
}