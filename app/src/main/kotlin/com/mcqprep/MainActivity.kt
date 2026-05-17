package com.mcqprep

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.mcqprep.ui.theme.McqPrepTheme
import com.mcqprep.ui.screens.HomeScreen
import com.mcqprep.ui.screens.SessionScreen
import com.mcqprep.ui.screens.SessionViewModel
import com.mcqprep.ui.screens.StatsScreen

import com.mcqprep.data.local.AppDatabase
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val db = AppDatabase.getDatabase(this)
        setContent {
            McqPrepTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation(db)
                }
            }
        }
    }
}

@Composable
fun AppNavigation(db: AppDatabase) {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = "home") {
        composable("home") { HomeScreen(navController) }
        composable("session/{mode}") { backStackEntry ->
            val mode = backStackEntry.arguments?.getString("mode") ?: "practice"
            val viewModel: SessionViewModel = viewModel(
                factory = object : ViewModelProvider.Factory {
                    override fun <T : ViewModel> create(modelClass: Class<T>): T {
                        return SessionViewModel(
                            db.conceptDao(),
                            db.questionDao(),
                            db.reviewDao()
                        ) as T
                    }
                }
            )
            SessionScreen(navController, mode, viewModel)
        }
        composable("stats") { StatsScreen(navController) }
    }
}
