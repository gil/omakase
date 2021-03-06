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
set :pty, true

# Default value for :linked_files is []
# set :linked_files, %w{config/database.yml}

# Default value for linked_dirs is []
# set :linked_dirs, %w{bin log tmp/pids tmp/cache tmp/sockets vendor/bundle public/system}
set :linked_dirs, %w{rails/log rails/tmp/pids client/bower_components client/node_modules}

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
# set :keep_releases, 5

namespace :deploy do

  desc 'Bundle install rails app dependencies'
  task :bundle_install do
    on roles(:app) do

      within release_path.join('rails') do
        execute :bundle, :install
      end

    end
  end

  before :updated, :bundle_install

  desc 'Install client dependencies'
  task :client_dependencies do
    on roles(:app) do

      within release_path.join('client') do
        execute :npm, :install
        execute :bower, :install, "--config.interactive=false"
      end

    end
  end

  before :updated, :client_dependencies

  desc 'Build client'
  task :build_client do
    on roles(:app) do

      within release_path.join('client') do
        execute :gulp, :build
      end

    end
  end

  after :updated, :build_client

  desc 'Update database'
  task :update_db do
    on roles(:app) do

      within release_path.join('rails') do
        execute :bundle, :exec, :rake, "db:create"
        execute :bundle, :exec, :rake, "db:migrate"
      end

    end
  end

  after :updated, :update_db

  desc 'Restart application'
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do

      # Your restart mechanism here, for example:
      # execute :touch, release_path.join('tmp/restart.txt')
      invoke 'unicorn:restart'
      invoke 'nginx:restart'

    end
  end

  after :publishing, :restart

  # after :restart, :clear_cache do
  #   on roles(:web), in: :groups, limit: 3, wait: 10 do
  #     # Here we can do anything such as:
  #     # within release_path do
  #     #   execute :rake, 'cache:clear'
  #     # end
  #   end
  # end

end

# Create service start/stop/restart tasks
{ :nginx => :nginx,
  :unicorn => :unicorn_my_app }.each do |name, service|

  namespace name do

    [:start, :stop, :restart].each do |action|
      desc "#{action} #{name}"
      task action do
        on roles(:app), in: :sequence, wait: 1 do
          begin
            execute :sudo, :service, service, action
          rescue
            warn ": task \"#{action} #{name}\" failed, skipping..."
          end
        end
      end
    end

  end

end
