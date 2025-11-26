//
//  MusicTrack.swift
//  Design Premium Music Organizer
//
//  Data model for individual music tracks
//

import Foundation
import SwiftData

@Model
final class MusicTrack {
    var id: UUID
    var title: String
    var artist: String
    var album: String
    var duration: TimeInterval
    var fileURL: URL
    var artworkData: Data?
    var genre: String
    var year: Int?
    var trackNumber: Int?
    var dateAdded: Date
    var isFavorite: Bool
    
    @Relationship(deleteRule: .nullify, inverse: \Playlist.tracks)
    var playlists: [Playlist]?
    
    init(
        title: String,
        artist: String,
        album: String,
        duration: TimeInterval,
        fileURL: URL,
        artworkData: Data? = nil,
        genre: String = "Unknown",
        year: Int? = nil,
        trackNumber: Int? = nil,
        isFavorite: Bool = false
    ) {
        self.id = UUID()
        self.title = title
        self.artist = artist
        self.album = album
        self.duration = duration
        self.fileURL = fileURL
        self.artworkData = artworkData
        self.genre = genre
        self.year = year
        self.trackNumber = trackNumber
        self.dateAdded = Date()
        self.isFavorite = isFavorite
    }
    
    var durationFormatted: String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}
