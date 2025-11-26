//
//  MusicPlayerService.swift
//  ReplayMusic
//
//  Created on 11/25/2025.
//

import Foundation
import AVFoundation
import Combine

@MainActor
class MusicPlayerService: ObservableObject {
    @Published var currentTrack: MusicTrack?
    @Published var isPlaying = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var playbackQueue: [MusicTrack] = []
    @Published var shuffleEnabled = false
    @Published var repeatMode: RepeatMode = .off
    
    private var player: AVPlayer?
    private var timeObserver: Any?
    private var cancellables = Set<AnyCancellable>()
    
    enum RepeatMode {
        case off
        case one
        case all
    }
    
    init() {
        setupAudioSession()
        setupObservers()
    }
    
    deinit {
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
        }
    }
    
    // MARK: - Playback Control
    
    func play(track: MusicTrack, queue: [MusicTrack] = []) {
        currentTrack = track
        playbackQueue = queue.isEmpty ? [track] : queue
        
        let playerItem = AVPlayerItem(url: track.fileURL)
        player = AVPlayer(playerItem: playerItem)
        
        setupTimeObserver()
        player?.play()
        isPlaying = true
        
        duration = track.duration
    }
    
    func play() {
        player?.play()
        isPlaying = true
    }
    
    func pause() {
        player?.pause()
        isPlaying = false
    }
    
    func togglePlayPause() {
        if isPlaying {
            pause()
        } else {
            play()
        }
    }
    
    func stop() {
        player?.pause()
        player = nil
        currentTrack = nil
        isPlaying = false
        currentTime = 0
    }
    
    func seek(to time: TimeInterval) {
        let cmTime = CMTime(seconds: time, preferredTimescale: 600)
        player?.seek(to: cmTime)
        currentTime = time
    }
    
    func skipForward() {
        guard let currentIndex = playbackQueue.firstIndex(where: { $0.id == currentTrack?.id }),
              currentIndex < playbackQueue.count - 1 else {
            if repeatMode == .all, let firstTrack = playbackQueue.first {
                play(track: firstTrack, queue: playbackQueue)
            }
            return
        }
        
        let nextTrack = playbackQueue[currentIndex + 1]
        play(track: nextTrack, queue: playbackQueue)
    }
    
    func skipBackward() {
        if currentTime > 3 {
            seek(to: 0)
            return
        }
        
        guard let currentIndex = playbackQueue.firstIndex(where: { $0.id == currentTrack?.id }),
              currentIndex > 0 else {
            seek(to: 0)
            return
        }
        
        let previousTrack = playbackQueue[currentIndex - 1]
        play(track: previousTrack, queue: playbackQueue)
    }
    
    func toggleShuffle() {
        shuffleEnabled.toggle()
        if shuffleEnabled {
            playbackQueue.shuffle()
        }
    }
    
    func toggleRepeat() {
        switch repeatMode {
        case .off:
            repeatMode = .all
        case .all:
            repeatMode = .one
        case .one:
            repeatMode = .off
        }
    }
    
    // MARK: - Private Methods
    
    private func setupAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .default)
            try audioSession.setActive(true)
        } catch {
            print("Failed to setup audio session: \(error)")
        }
    }
    
    private func setupObservers() {
        NotificationCenter.default.publisher(for: .AVPlayerItemDidPlayToEndTime)
            .sink { [weak self] _ in
                self?.handleTrackEnded()
            }
            .store(in: &cancellables)
    }
    
    private func setupTimeObserver() {
        let interval = CMTime(seconds: 0.5, preferredTimescale: 600)
        timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            self?.currentTime = time.seconds
        }
    }
    
    private func handleTrackEnded() {
        if repeatMode == .one {
            seek(to: 0)
            play()
        } else {
            skipForward()
        }
    }
}
