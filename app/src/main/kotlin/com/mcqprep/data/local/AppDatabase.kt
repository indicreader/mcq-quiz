package com.mcqprep.data.local

import androidx.room.*
import com.mcqprep.data.local.entity.*
import com.mcqprep.data.local.dao.*
import java.util.Date

@Database(
    entities = [
        DeckEntity::class,
        SubjectEntity::class,
        TopicEntity::class,
        ConceptEntity::class,
        QuestionEntity::class,
        OptionEntity::class,
        ReviewLogEntity::class,
        SessionStateEntity::class,
        ExamPatternEntity::class,
        SessionAnalyticsEntity::class,
        SettingsEntity::class,
        NotificationScheduleEntity::class
    ],
    version = 3,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun deckDao(): DeckDao
    abstract fun conceptDao(): ConceptDao
    abstract fun questionDao(): QuestionDao
    abstract fun reviewDao(): ReviewDao
    abstract fun studyDao(): StudyDao
    abstract fun settingsDao(): SettingsDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: android.content.Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "mcq_prep_db"
                )
                .fallbackToDestructiveMigration()
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

class Converters {
    @TypeConverter
    fun fromTimestamp(value: Long?): Date? = value?.let { Date(it) }

    @TypeConverter
    fun dateToTimestamp(date: Date?): Long? = date?.time
}
