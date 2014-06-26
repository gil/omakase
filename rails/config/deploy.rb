# config valid only for Capistrano 3.1
lock '3.2.1'

set :application, 'my-app'

# Default branch is :master
# ask :branch, proc { `git rev-parse --abbrev-ref HEAD`.chomp }.call

# Default deploy_to directory is /var/www/my_app
set :deploy_to, '~/apps/' + fetch(:application)

# Default value for :scm is :git
# set :scm, :git

# Default value for :format is :pretty
# set :format, :pretty

# Default value for :log_level is :debug
# set :log_level, :debug

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
# set :linked_files, %w{config/database.yml}

# Default value for linked_dirs is []
# set :linked_dirs, %w{bin log tmp/pids tmp/cache tmp/sockets vendor/bundle public/system}

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
# set :keep_releases, 5

namespace :deploy do

  desc 'Restart application'
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do
      # Your restart mechanism here, for example:
      # execute :touch, release_path.join('tmp/restart.txt')
    end
  end

  after :publishing, :restart

  desc 'Bundle install rails app dependencies'
  task :bundle_install do
    on roles(:app) do

      within current_path.join('server') do
        execute :bundle, :install
      end

    end
  end

  before :restart, :bundle_install

  desc 'Update database'
  task :update_db do
    on roles(:app) do

      within current_path.join('server') do
        execute :bundle, :exec, :rake, "db:create"
        execute :bundle, :exec, :rake, "db:migrate"
      end

    end
  end

  after :bundle_install, :update_db

  # after :restart, :clear_cache do
  #   on roles(:web), in: :groups, limit: 3, wait: 10 do
  #     # Here we can do anything such as:
  #     # within release_path do
  #     #   execute :rake, 'cache:clear'
  #     # end
  #   end
  # end

end
