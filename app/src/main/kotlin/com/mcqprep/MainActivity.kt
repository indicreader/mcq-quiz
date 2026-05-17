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
import androidx.compose.runtime.LaunchedEffect
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import androidx.navigation.NavType
import com.mcqprep.ui.theme.McqPrepTheme
import com.mcqprep.ui.screens.HomeScreen
import com.mcqprep.ui.screens.SessionScreen
import com.mcqprep.ui.screens.SessionViewModel
import com.mcqprep.ui.screens.StatsScreen
import com.mcqprep.ui.screens.AddQuestionScreen

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
        composable("home") { HomeScreen(navController, db.conceptDao(), db.studyDao()) }
        composable(
            route = "session/{mode}?deckId={deckId}",
            arguments = listOf(
                navArgument("mode") { type = NavType.StringType },
                navArgument("deckId") { 
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val mode = backStackEntry.arguments?.getString("mode") ?: "practice"
            val deckId = backStackEntry.arguments?.getString("deckId")
            val viewModel: SessionViewModel = viewModel(
                factory = object : ViewModelProvider.Factory {
                    override fun <T : ViewModel> create(modelClass: Class<T>): T {
                        return SessionViewModel(
                            db.conceptDao(),
                            db.questionDao(),
                            db.reviewDao(),
                            db.studyDao()
                        ) as T
                    }
                }
            )
            LaunchedEffect(mode, deckId) {
                viewModel.startSession(mode, deckId)
            }
            SessionScreen(navController, mode, viewModel)
        }
        composable("stats") { StatsScreen(navController) }
        composable("add") { 
            AddQuestionScreen(
                navController = navController,
                conceptDao = db.conceptDao(),
                questionDao = db.questionDao()
            )
        }
    }
}
