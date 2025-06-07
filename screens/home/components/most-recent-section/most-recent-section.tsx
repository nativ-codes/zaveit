import { PreviewPostCard } from "@/common/components";
import { Units } from "@/common/constants/units";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { styles } from "./most-recent-section.style";
import { MostRecentSectionPropsType } from "./most-recent-section.type";

function MostRecentSection({
  posts,
  onPostPress,
  onViewAll,
}: MostRecentSectionPropsType) {
  return (
    <View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Most recent</Text>
        <TouchableOpacity hitSlop={Units.s16} onPress={onViewAll}>
          <Text style={styles.seeAllButtonText}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}
        contentContainerStyle={styles.horizontalScrollContent}
      >
        {posts.map((post) => (
          <PreviewPostCard
            key={post.timestamp}
            url={post.url}
            title={post.title}
            thumbnail={post.thumbnail}
            tags={post.tags}
            onPress={() => onPostPress(post.timestamp)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default MostRecentSection;
