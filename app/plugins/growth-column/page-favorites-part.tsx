        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="bg-white rounded-xl shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-semibold">我的收藏 ({favorites.length})</h3>
            </div>
            {favorites.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Heart className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>还没有收藏任何书籍</p>
              </div>
            ) : (
              <div className="divide-y">
                {favorites.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 hover:bg-gray-50 ${item.status === 1 ? 'bg-green-50' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="cursor-pointer flex-1" onClick={() => {
                        setBookName(item.book_name);
                        handleSearch();
                        setActiveTab('search');
                      }}>
                        <h4 className="font-medium flex items-center gap-2">
                          {item.book_name}
                          {item.status === 1 && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              已讀
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {item.author && <span className="text-sm text-gray-500">{item.author}</span>}
                          {item.category && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleReadStatus(item)}
                          className={`p-2 rounded-lg ${
                            item.status === 1 
                              ? 'text-yellow-600 hover:bg-yellow-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={item.status === 1 ? '標記為未讀' : '標記為已讀'}
                        >
                          {item.status === 1 ? (
                            <span className="text-xs font-medium">↺</span>
                          ) : (
                            <span className="text-xs font-medium">✓</span>
                          )}
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await fetch(`/api/plugins/growth-column/favorites?id=${item.id}`, {
                                method: 'DELETE'
                              });
                              await fetchFavorites();
                            } catch (error) {
                              console.error('Delete failed:', error);
                            }
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
</content></seed:tool_call>