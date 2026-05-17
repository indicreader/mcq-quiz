package com.mcqprep.ui.screens

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.mcqprep.data.local.dao.SettingsDao
import com.mcqprep.data.local.entity.NotificationScheduleEntity
import com.mcqprep.data.local.entity.SettingsEntity
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class SettingsViewModel(private val settingsDao: SettingsDao) : ViewModel() {

    val settings: StateFlow<SettingsEntity> = settingsDao.getSettings()
        .map { it ?: SettingsEntity() }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = SettingsEntity()
        )

    val schedules: StateFlow<List<NotificationScheduleEntity>> = settingsDao.getNotificationSchedules()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun updateSettings(settings: SettingsEntity) {
        viewModelScope.launch {
            settingsDao.saveSettings(settings)
        }
    }

    fun saveSchedule(schedule: NotificationScheduleEntity) {
        viewModelScope.launch {
            settingsDao.saveNotificationSchedule(schedule)
        }
    }

    fun deleteSchedule(schedule: NotificationScheduleEntity) {
        viewModelScope.launch {
            settingsDao.deleteNotificationSchedule(schedule)
        }
    }
}
