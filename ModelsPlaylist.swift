//
//  Playlist.swift
//  Design Premium Music Organizer
//
//  Data model for playlists
//

import Foundation
import SwiftData

@Model
final class Playlist {
    var id: UUID
    var name: String
    var createdDate: Date
    var artworkData: Data?
    
    @Relationship(deleteRule: .nullify)
    var tracks: [MusicTrack]
    
    init(name: String, artworkData: Data? = nil) {
        self.id = UUID()
        self.name = name
        self.createdDate = Date()
        self.artworkData = artworkData
        self.tracks = []
    }
    
    var trackCount: Int {
        tracks.count
    }
    
    var totalDuration: TimeInterval {
        tracks.reduce(0) { $0 + $1.duration }
    }
}
