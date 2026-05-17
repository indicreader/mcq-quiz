package com.mcqprep.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.mcqprep.data.local.entity.SettingsEntity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(navController: NavController, viewModel: SettingsViewModel) {
    val settings by viewModel.settings.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            item { SettingsHeader("Appearance") }
            item {
                SettingsDropdown(
                    label = "Theme Mode",
                    options = listOf("DARK", "AMOLED", "LIGHT"),
                    selected = settings.themeMode,
                    onSelected = { viewModel.updateSettings(settings.copy(themeMode = it)) }
                )
            }
            item {
                SettingsDropdown(
                    label = "Font Family",
                    options = listOf("SANS_SERIF", "DYSLEXIA", "SERIF", "MONOSPACE", "ARIAL"),
                    selected = settings.fontFamily,
                    onSelected = { viewModel.updateSettings(settings.copy(fontFamily = it)) }
                )
            }
            item {
                SettingsSlider(
                    label = "Font Size",
                    value = settings.fontSize.toFloat(),
                    range = 12f..32f,
                    onValueChange = { viewModel.updateSettings(settings.copy(fontSize = it.toInt())) }
                )
            }
            item {
                SettingsDropdown(
                    label = "Reading Density",
                    options = listOf("COMPACT", "COMFORTABLE", "SPACIOUS"),
                    selected = settings.readingDensity,
                    onSelected = { viewModel.updateSettings(settings.copy(readingDensity = it)) }
                )
            }

            item { Divider(Modifier.padding(vertical = 16.dp)) }
            item { SettingsHeader("Study Experience") }
            item {
                SettingsToggle(
                    label = "Confirm Answer",
                    description = "Separate button to finalize your choice (Excluding Test mode)",
                    checked = settings.confirmBeforeSubmit,
                    onCheckedChange = { viewModel.updateSettings(settings.copy(confirmBeforeSubmit = it)) }
                )
            }
            item {
                SettingsToggle(
                    label = "Show Answer Immediately",
                    description = "See truth right after confirmation",
                    checked = settings.showAnswerImmediately,
                    onCheckedChange = { viewModel.updateSettings(settings.copy(showAnswerImmediately = it)) }
                )
            }
            item {
                SettingsToggle(
                    label = "Auto Next",
                    description = "Automatically move to next question after result",
                    checked = settings.autoNext,
                    onCheckedChange = { viewModel.updateSettings(settings.copy(autoNext = it)) }
                )
            }

            item { Divider(Modifier.padding(vertical = 16.dp)) }
            item { SettingsHeader("System & Immersive") }
            item {
                SettingsToggle(
                    label = "Fullscreen Immersive",
                    checked = settings.isFullscreen,
                    onCheckedChange = { viewModel.updateSettings(settings.copy(isFullscreen = it)) }
                )
            }
            item {
                SettingsToggle(
                    label = "Keep Screen Awake",
                    checked = settings.keepScreenAwake,
                    onCheckedChange = { viewModel.updateSettings(settings.copy(keepScreenAwake = it)) }
                )
            }
            item {
                SettingsDropdown(
                    label = "Orientation",
                    options = listOf("PORTRAIT", "LANDSCAPE", "AUTO"),
                    selected = settings.orientation,
                    onSelected = { viewModel.updateSettings(settings.copy(orientation = it)) }
                )
            }

            item { Divider(Modifier.padding(vertical = 16.dp)) }
            item { SettingsHeader("Data & Backup") }
            item {
                ListItem(
                    headlineContent = { Text("Export to CSV") },
                    leadingContent = { Icon(Icons.Default.Share, null) },
                    modifier = Modifier.clickable { /* TODO */ }
                )
            }
            item {
                ListItem(
                    headlineContent = { Text("Local Backup Now") },
                    leadingContent = { Icon(Icons.Default.Backup, null) },
                    modifier = Modifier.clickable { /* TODO */ }
                )
            }
            
            item { Spacer(Modifier.height(32.dp)) }
        }
    }
}

@Composable
fun SettingsHeader(title: String) {
    Text(
        text = title.uppercase(),
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.primary,
        fontWeight = FontWeight.Bold,
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
    )
}

@Composable
fun SettingsToggle(
    label: String,
    description: String? = null,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    ListItem(
        headlineContent = { Text(label) },
        supportingContent = description?.let { { Text(it) } },
        trailingContent = {
            Switch(checked = checked, onCheckedChange = onCheckedChange)
        }
    )
}

@Composable
fun SettingsSlider(
    label: String,
    value: Float,
    range: ClosedFloatingPointRange<Float>,
    onValueChange: (Float) -> Unit
) {
    Column(Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, style = MaterialTheme.typography.bodyLarge)
            Text(value.toInt().toString(), style = MaterialTheme.typography.bodySmall)
        }
        Slider(
            value = value,
            onValueChange = onValueChange,
            valueRange = range
        )
    }
}

@Composable
fun SettingsDropdown(
    label: String,
    options: List<String>,
    selected: String,
    onSelected: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    
    Box(Modifier.fillMaxWidth()) {
        ListItem(
            headlineContent = { Text(label) },
            trailingContent = { 
                Text(selected)
                Icon(Icons.Default.ArrowDropDown, null) 
            },
            modifier = Modifier.clickable { expanded = true }
        )
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(option) },
                    onClick = {
                        onSelected(option)
                        expanded = false
                    }
                )
            }
        }
    }
}
