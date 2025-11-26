//
//  Album.swift
//  Design Premium Music Organizer
//
//  Data model for albums
//

import Foundation
import SwiftData

@Model
final class Album {
    var id: UUID
    var title: String
    var artist: String
    var year: Int?
    var artworkData: Data?
    var genre: String
    
    init(title: String, artist: String, year: Int? = nil, artworkData: Data? = nil, genre: String = "Unknown") {
        self.id = UUID()
        self.title = title
        self.artist = artist
        self.year = year
        self.artworkData = artworkData
        self.genre = genre
    }
}
