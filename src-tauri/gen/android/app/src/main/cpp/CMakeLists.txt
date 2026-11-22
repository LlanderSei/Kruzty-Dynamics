cmake_minimum_required(VERSION 3.22.1)
project(discord_social_bridge LANGUAGES CXX)

find_package(discord_partner_sdk REQUIRED CONFIG)
add_library(discord_social_bridge SHARED discord_social_bridge.cpp)
find_library(log-lib log)
target_compile_features(discord_social_bridge PRIVATE cxx_std_17)
target_link_libraries(discord_social_bridge PRIVATE discord_partner_sdk::discord_partner_sdk ${log-lib})
