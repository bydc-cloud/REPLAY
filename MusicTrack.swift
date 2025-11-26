//
//  MusicTrack.swift
//  ReplayMusic
//
//  Created on 11/25/2025.
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
    var dateAdded: Date
    var genre: String?
    var year: Int?
    var playCount: Int
    var isFavorite: Bool
    
    @Relationship(inverse: \Playlist.tracks)
    var playlists: [Playlist]?
    
    init(
        id: UUID = UUID(),
        title: String,
        artist: String,
        album: String = "",
        duration: TimeInterval = 0,
        fileURL: URL,
        artworkData: Data? = nil,
        dateAdded: Date = Date(),
        genre: String? = nil,
        year: Int? = nil,
        playCount: Int = 0,
        isFavorite: Bool = false
    ) {
        self.id = id
        self.title = title
        self.artist = artist
        self.album = album
        self.duration = duration
        self.fileURL = fileURL
        self.artworkData = artworkData
        self.dateAdded = dateAdded
        self.genre = genre
        self.year = year
        self.playCount = playCount
        self.isFavorite = isFavorite
    }
}
