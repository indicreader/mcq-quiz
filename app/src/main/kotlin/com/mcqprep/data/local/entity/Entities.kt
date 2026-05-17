package com.mcqprep.data.local.entity

import androidx.room.*
import java.util.*

@Entity(tableName = "decks")
data class DeckEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val name: String,
    val description: String,
    val version: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "subjects",
    foreignKeys = [
        ForeignKey(
            entity = DeckEntity::class,
            parentColumns = ["id"],
            childColumns = ["deckId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class SubjectEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val deckId: String,
    val name: String
)

@Entity(
    tableName = "topics",
    foreignKeys = [
        ForeignKey(
            entity = SubjectEntity::class,
            parentColumns = ["id"],
            childColumns = ["subjectId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class TopicEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    val subjectId: String,
    val name: String
)

@Entity(
    tableName = "concepts",
    foreignKeys = [
        ForeignKey(
            entity = TopicEntity::class,
            parentColumns = ["id"],
            childColumns = ["topicId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class ConceptEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    @ColumnInfo(index = true) val topicId: String,
    val name: String,
    val description: String,
    // FSRS Metadata
    val stability: Double = 0.0,
    val difficulty: Double = 0.0,
    val elapsedDays: Int = 0,
    val scheduledDays: Int = 0,
    val reps: Int = 0,
    val lapses: Int = 0,
    val state: Int = 0, // 0: New, 1: Learning, 2: Review, 3: Relearning
    val lastReview: Long? = null,
    val nextReview: Long? = null,
    val isLeech: Boolean = false
)

@Entity(
    tableName = "questions",
    foreignKeys = [
        ForeignKey(
            entity = ConceptEntity::class,
            parentColumns = ["id"],
            childColumns = ["conceptId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class QuestionEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    @ColumnInfo(index = true) val conceptId: String,
    val text: String,
    val type: String = "MCQ",
    val explanation: String,
    val difficulty: String, // Easy, Medium, Hard
    val source: String?,
    val negativeMarking: Float = 0.25f,
    val tags: String // Comma separated tags
)

@Entity(
    tableName = "options",
    foreignKeys = [
        ForeignKey(
            entity = QuestionEntity::class,
            parentColumns = ["id"],
            childColumns = ["questionId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class OptionEntity(
    @PrimaryKey val id: String = UUID.randomUUID().toString(),
    @ColumnInfo(index = true) val questionId: String,
    val text: String,
    val isCorrect: Boolean,
    val order: Int // To maintain index if needed, but UI will shuffle
)

@Entity(
    tableName = "review_history",
    foreignKeys = [
        ForeignKey(
            entity = ConceptEntity::class,
            parentColumns = ["id"],
            childColumns = ["conceptId"],
            onDelete = ForeignKey.CASCADE
        )
    ]
)
data class ReviewLogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val conceptId: String,
    val rating: Int, // 1: Again, 2: Hard, 3: Good, 4: Easy
    val responseTime: Long,
    val scheduledDays: Int,
    val elapsedDays: Int,
    val stability: Double,
    val difficulty: Double,
    val reviewTime: Long = System.currentTimeMillis()
)
