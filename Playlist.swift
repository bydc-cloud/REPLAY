//
//  Playlist.swift
//  ReplayMusic
//
//  Created on 11/25/2025.
//

import Foundation
import SwiftData

@Model
final class Playlist {
    var id: UUID
    var name: String
    var dateCreated: Date
    var artworkData: Data?
    
    @Relationship(deleteRule: .nullify)
    var tracks: [MusicTrack]?
    
    init(
        id: UUID = UUID(),
        name: String,
        dateCreated: Date = Date(),
        artworkData: Data? = nil,
        tracks: [MusicTrack]? = nil
    ) {
        self.id = id
        self.name = name
        self.dateCreated = dateCreated
        self.artworkData = artworkData
        self.tracks = tracks
    }
    
    var trackCount: Int {
        tracks?.count ?? 0
    }
    
    var totalDuration: TimeInterval {
        tracks?.reduce(0) { $0 + $1.duration } ?? 0
    }
}
