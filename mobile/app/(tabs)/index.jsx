import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl } from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { MealAPI } from "../../services/mealAPI";
import { homeStyles } from "../../assets/styles/home.styles";
import { Image } from "expo-image";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import CategoryFilter from "../../components/CategoryFilter";
import RecipeCard from "../../components/RecipeCard";
import LoadingSpinner from "../../components/LoadingSpinner";

const HomeScreen = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredRecipe, setFeaturedRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch categories and featured meal
      const [apiCategories, featuredMeal] = await Promise.all([
        MealAPI.getCategories(),
        MealAPI.getRandomMeal(),
      ]);

      // Filter out "Beef" and transform categories
      const nonBeefCategories = apiCategories
        .filter(cat => cat.strCategory.toLowerCase() !== "beef")
        .map((cat, index) => ({
          id: index + 1,
          name: cat.strCategory,
          image: cat.strCategoryThumb,
          description: cat.strCategoryDescription,
        }));

      setCategories(nonBeefCategories);

      // Select first non-beef category
      const firstCategory = nonBeefCategories[0]?.name || null;
      setSelectedCategory(firstCategory);

      // Load recipes for the first category
      if (firstCategory) {
        await loadCategoryData(firstCategory);
      }

      // Set featured recipe
      const transformedFeatured = MealAPI.transformMealData(featuredMeal);
      setFeaturedRecipe(transformedFeatured);

    } catch (error) {
      console.log("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryData = async (category) => {
    try {
      const meals = await MealAPI.filterByCategory(category);
      const transformedMeals = meals
        .map(meal => MealAPI.transformMealData(meal))
        .filter(meal => meal !== null && meal.category.toLowerCase() !== "beef"); // exclude beef
      setRecipes(transformedMeals);
    } catch (error) {
      console.error("Error loading category data:", error);
      setRecipes([]);
    }
  };

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    await loadCategoryData(category);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !refreshing) {
    return <LoadingSpinner message="Loading delicious recipes..." />;
  }

  // Filter recipes once for rendering
  const nonBeefRecipes = recipes.filter(recipe => recipe.category.toLowerCase() !== "beef");

  return (
    <View style={homeStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={homeStyles.scrollContent}
      >
        {/* Animal Icons */}
        <View style={homeStyles.welcomeSection}>
          <Image source={require("../../assets/images/lamb.png")} style={{ width: 100, height: 100 }} />
          <Image source={require("../../assets/images/chicken.png")} style={{ width: 100, height: 100 }} />
          <Image source={require("../../assets/images/pork.png")} style={{ width: 100, height: 100 }} />
        </View>

        {/* Featured Section */}
        {featuredRecipe && (
          <View style={homeStyles.featuredSection}>
            <TouchableOpacity
              style={homeStyles.featuredCard}
              activeOpacity={0.9}
              onPress={() => router.push(`/recipe/${featuredRecipe.id}`)}
            >
              <View style={homeStyles.featuredImageContainer}>
                <Image
                  source={{ uri: featuredRecipe.image }}
                  style={homeStyles.featuredImage}
                  contentFit="cover"
                  transition={500}
                />
                <View style={homeStyles.featuredOverlay}>
                  <View style={homeStyles.featuredBadge}>
                    <Text style={homeStyles.featuredBadgeText}>Featured</Text>
                  </View>

                  <View style={homeStyles.featuredContent}>
                    <Text style={homeStyles.featuredTitle} numberOfLines={2}>
                      {featuredRecipe.title}
                    </Text>

                    <View style={homeStyles.featuredMeta}>
                      <View style={homeStyles.metaItem}>
                        <Ionicons name="time-outline" size={16} color={COLORS.white} />
                        <Text style={homeStyles.metaText}>{featuredRecipe.cookTime}</Text>
                      </View>
                      <View style={homeStyles.metaItem}>
                        <Ionicons name="people-outline" size={16} color={COLORS.white} />
                        <Text style={homeStyles.metaText}>{featuredRecipe.servings}</Text>
                      </View>
                      {featuredRecipe.area && (
                        <View style={homeStyles.metaItem}>
                          <Ionicons name="location-outline" size={16} color={COLORS.white} />
                          <Text style={homeStyles.metaText}>{featuredRecipe.area}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <CategoryFilter
            categories={categories} // already non-beef
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        )}

        {/* Recipes Section */}
        {selectedCategory && (
          <View style={homeStyles.recipesSection}>
            <View style={homeStyles.sectionHeader}>
              <Text style={homeStyles.sectionTitle}>{selectedCategory}</Text>
            </View>

            {nonBeefRecipes.length > 0 ? (
              <FlatList
                data={nonBeefRecipes}
                renderItem={({ item }) => <RecipeCard recipe={item} />}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                columnWrapperStyle={homeStyles.row}
                contentContainerStyle={homeStyles.recipesGrid}
                scrollEnabled={false}
              />
            ) : (
              <View style={homeStyles.emptyState}>
                <Ionicons name="restaurant-outline" size={64} color={COLORS.textLight} />
                <Text style={homeStyles.emptyTitle}>No recipes found</Text>
                <Text style={homeStyles.emptyDescription}>Try a different category</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default HomeScreen;
